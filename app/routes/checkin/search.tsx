import type { Route } from "./+types/search";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { useDebounce } from "~/hooks/debounce";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { data, redirect, useFetcher, useNavigate } from "react-router";
import { toast } from "sonner";
import { getClientIP } from "~/uitilities/ip";
import { commitSession, getSession } from "~/session.server";

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

export async function action({ request }: Route.ActionArgs) {
  const ip = await getClientIP();

  const session = await getSession(request.headers.get("Cookie"));

  const accessToken = session?.get("accessToken") || "";

  const formData = await request.formData();

  const search = String(formData.get("search"));

  try {
    const response = await fetch(
      `${import.meta.env.VITE_PUBLIC_BASE_URL}/api/tickets?search=${search}`,
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

    // toast.error(error?.message || "something went wrong");
  }
}

export default function Search() {
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const errors = fetcher?.data?.errors;
  const response = fetcher?.data?.response;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      close();
    }
  };

  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchInput = useDebounce(searchInput, 500);

  useEffect(() => {
    fetcher.submit(
      { search: debouncedSearchInput },
      { action: "/checkin/search", method: "post" }
    );
  }, [debouncedSearchInput]);

  return (
    <main className='pt-24 xl:pt-32 pb-4 px-4 lg:px-8 min-h-dvh'>
      <div className='max-w-2xl mx-auto w-full'>
        <div className='text-center space-y-2'>
          <h1 className='text-3xl font-bold text-center'>
            Check-in with Search
          </h1>
          <p>
            Kindly place input your email, ID number or Full name to find your
            ticket and check-in.
          </p>
        </div>

        <div className='mt-8'>
          {errors?.server && (
            <em className='text-red-400 text-xs mb-2'>{errors?.server}</em>
          )}
          <Command
            shouldFilter={false}
            onKeyDown={handleKeyDown}
            className='overflow-visible'
          >
            <div className='flex w-full items-center justify-between rounded-full border bg-background ring-offset-background text-sm focus-within:border-ring'>
              <CommandInput
                value={searchInput}
                onValueChange={setSearchInput}
                onBlur={close}
                onFocus={open}
                placeholder='Name, Email, Ticket ID'
                containerClassName='w-full border-transparent'
                className='w-full indent-3 outline-none border-transparent'
              />
            </div>

            {isOpen && debouncedSearchInput !== "" && (
              <div className='relative animate-in fade-in-0 zoom-in-95 h-auto'>
                <CommandList>
                  <div className='absolute top-1.5 z-50 w-full'>
                    <CommandGroup className='relative h-auto z-50 min-w-[8rem] overflow-hidden rounded-xl border shadow-md bg-background'>
                      {fetcher.state === "idle" && response?.count === 0 && (
                        <CommandEmpty>No Ticket found.</CommandEmpty>
                      )}
                      {fetcher.state !== "idle" ? (
                        <div className='h-28 flex items-center justify-center'>
                          <Loader2 className='size-6 animate-spin' />
                        </div>
                      ) : (
                        <>
                          {response?.tickets?.map(
                            (ticket: any, index: number) => (
                              <CommandItem
                                key={ticket.id || index}
                                value={ticket.id}
                                onSelect={() => {
                                  setSearchInput("");
                                  navigate(
                                    `/checkin/preview?ticketId=${ticket.ticketId}`
                                  );
                                }}
                                className='flex select-text flex-col cursor-pointer gap-0.5 h-max p-2 px-3 rounded-md aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent hover:text-accent-foreground items-start'
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                <span>
                                  <span className='font-medium'>
                                    {ticket?.attendee?.fullName}
                                  </span>
                                  ,{" "}
                                  <span className='text-sm opacity-65'>
                                    {ticket?.attendee?.email}
                                  </span>
                                </span>
                              </CommandItem>
                            )
                          )}
                        </>
                      )}
                    </CommandGroup>
                  </div>
                </CommandList>
              </div>
            )}
          </Command>
        </div>
      </div>
    </main>
  );
}
