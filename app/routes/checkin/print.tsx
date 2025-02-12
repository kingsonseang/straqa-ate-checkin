import { data, redirect, useFetcher } from "react-router";
import type { Route } from "./+types/print";
import { getClientIP } from "~/uitilities/ip";
import { commitSession, getSession } from "~/session.server";
import { Loading02 } from "@untitled-ui/icons-react";
import { useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import useSWRMutation from "swr/mutation";

import ateLogo from "./ate-logo.svg";
import { toast } from "sonner";

async function updateTagPickup(
  url: string,
  {
    arg,
  }: {
    arg: {
      ticketId: string;
      location: string;
      ip: string;
      accessToken?: string;
    };
  }
) {
  try {
    const ip = await getClientIP();

    const response = await fetch(
      `${url}/api/tickets/${arg.ticketId}/tag-pickup`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": arg.ip,
          Authorization: `Bearer ${arg.accessToken}`,
        },
        body: JSON.stringify({ location: arg.location }),
      }
    );

    if (!response.ok) {
      const responseData = await response.json();

      throw new Error(responseData?.message || "Cannot reach server.");
    }

    return response.json();
  } catch (error: any) {
    return {
      is_error: true,
      message: error?.message || "Failed to update ticket status",
    };
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("accessToken")) {
    return redirect("/");
  }

  const params = new URLSearchParams(request.url.split("?")[1]);

  if (!params.has("ticketId")) {
    return redirect("/checkin");
  }

  const ticketId = params.get("ticketId");

  if (!ticketId) {
    return redirect("/checkin");
  }

  const ip = await getClientIP();

  return data(
    {
      error: {
        server: session.get("error"),
      },
      ticketId,
      accessToken: session.get("accessToken"),
      ip,
    },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  const formData = await request.formData();

  const ticketId = String(formData.get("ticketId"));

  const ip = await getClientIP();

  const accessToken = session?.get("accessToken") || "";

  try {
    const response = await fetch(
      `${import.meta.env.VITE_PUBLIC_BASE_URL}/api/tickets/${ticketId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": ip,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const responseData = await response.json();

      throw new Error(responseData?.message || "Cannot reach server.");
    }

    const responseData = await response.json();

    if (!responseData)
      return data(
        {
          errors: {
            server: responseData?.message || "Cannot reach checkin server.",
          },
        },
        { status: 400 }
      );

    return data(
      {
        response: responseData?.data,
        errors: {},
        ip,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return data(
      {
        errors: {
          server: error?.message || "Cannot reach checkin server.",
        },
      },
      { status: 400 }
    );
  }
}

export default function Print({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const response = fetcher.data?.response;

  const printRef = useRef(null);

  useEffect(() => {
    fetcher.submit(
      { ticketId: loaderData?.ticketId },
      { action: "/checkin/preview", method: "post" }
    );
  }, []);

  const { trigger, isMutating } = useSWRMutation(
    import.meta.env.VITE_PUBLIC_BASE_URL,
    updateTagPickup
  );

  async function printBadge() {
    try {
      console.log("Updating ticket status...");

      // 1️⃣ Trigger API update before printing
      const { ticketId, ip, accessToken } = loaderData;
      const res = await trigger({
        ticketId,
        location: "Cafe one, VI, Lagos",
        ip,
        accessToken,
      });

      if (res.is_error) {
        toast.error(res?.message || "Failed to update ticket status");
        return;
      }
      toast.success(res?.message || "Ticket status updated successfully");

      console.log("Generating print image...");

      if (!printRef.current) return;

      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      console.log("Image ready, creating PDF...");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [400, 200], // Match your print size
      });

      pdf.addImage(imgData, "PNG", 0, 0, 400, 200);

      console.log("Sending PDF to printer...");
      pdf.output("dataurlnewwindow");
      pdf.autoPrint(); // Trigger silent print

      // Open print dialog
      // window.open(pdf.output("bloburl"), "_blank");
    } catch (e) {}
  }

  if (fetcher.state !== "idle") {
    return (
      <main className='pt-24 xl:pt-32 pb-4 px-4 lg:px-8 min-h-dvh flex justify-center items-center'>
        <Loading02 className='animate-spin' />
      </main>
    );
  }

  if (response) {
    return (
      <main className='pt-24 xl:pt-32 pb-4 px-4 lg:px-8 min-h-dvh'>
        <div className='max-w-xl mx-auto w-full space-y-12'>
          <div className='text-center space-y-2'>
            <h1 className='text-3xl font-bold text-center'>
              Preview your Badge
            </h1>
            <p>Kindly preview your badge before you print.</p>
          </div>

          <div className='p-6 bg-black text-white rounded-3xl space-y-4'>
            <img
              src={ateLogo}
              alt='Africa Technology Expo'
              className='w-32 mx-auto'
            />

            <div className='p-6'>
              <h2 className='font-mono text-5xl'>
                {response?.attendee?.fullName}
              </h2>
              <p className='opacity-60'>{response?.role}</p>
            </div>
          </div>

          <div className='flex justify-center items-center'>
            <Button
              onClick={printBadge}
              className='h-auto py-3 min-w-[80%] cursor-pointer'
            >
              {isMutating && <Loading02 className='animate-spin' />}
              <span>Print Badge</span>
            </Button>
          </div>
        </div>

        <div
          ref={printRef}
          className='absolute -left-[999px] w-[400px] h-[200px] flex flex-col justify-center items-center bg-white p-6 text-center uppercase space-y-3.5'
        >
          <h2 className='text-5xl font-mono leading-none'>
            {response?.attendee?.fullName}
          </h2>
          <div className='leading-none space-y-0.5'>
            <p className='opacity-80 text-lg'>{response?.company}</p>
            <p className='opacity-80'>{response?.role}</p>
          </div>
        </div>
      </main>
    );
  }
}
