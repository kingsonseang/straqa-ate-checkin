import type { Route } from "./+types/search";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { useDebounce } from "~/hooks/debounce";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { data, redirect, useFetcher, useNavigate } from "react-router";
import { toast } from "sonner";
import { getClientIP } from "~/uitilities/ip";
import { commitSession, getSession } from "~/session.server";
import { Button } from "~/components/ui/button";
import QrScanner from "qr-scanner";
import QrFrame from "./qr-frame.svg";
import { Scanner } from "@yudiel/react-qr-scanner";
import Html5QrcodePlugin from "~/components/Html5QrcodeScanner";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("accessToken")) {
    return redirect("/");
  }

  return data(
    { error: session.get("error") },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
}

export default function QrCode() {
  const navigate = useNavigate();
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  return (
    <main className='pt-24 xl:pt-32 pb-4 px-4 lg:px-8 min-h-dvh'>
      <div className='max-w-2xl mx-auto w-full space-y-8'>
        <div className='text-center space-y-2'>
          <h1 className='text-3xl font-bold text-center'>
            Badge Scanning Process
          </h1>
          <p>
            Kindly place your QR Code in view of the camera to scan. Make sure
            your hand is steady for faster capture.
          </p>
        </div>

        {!scannedResult && (
          <div className='space-y-3'>
            <div className='overflow-hidden rounded-xl max-w-96 mx-auto'>
              <Html5QrcodePlugin
                fps={10}
                qrbox={300}
                disableFlip={false}
                qrCodeSuccessCallback={(decodedText) => {
                  setScannedResult(decodedText);
                }}
                className='!border-transparent bg-gray-50'
              />
            </div>
            <p className='text-center text-sm'>
              Position the QR code within the frame to scan
            </p>
          </div>
        )}

        {scannedResult && (
          <div className='grid gap-3 max-w-96 mx-auto'>
            <Button
              onClick={() =>
                navigate(`/checkin/preview?ticketId=${scannedResult}`)
              }
            >
              Continue to preview: {scannedResult}
            </Button>

            <Button variant='outline' onClick={() => window.location.reload()}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
