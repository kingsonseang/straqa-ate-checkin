import { data, Link, redirect, useFetcher } from "react-router";
import type { Route } from "./+types/print";
import { getClientIP } from "~/uitilities/ip";
import { commitSession, getSession } from "~/session.server";
import { Input } from "~/components/ui/input";
import { Loading02 } from "@untitled-ui/icons-react";
import { useEffect } from "react";
import { Label } from "~/components/ui/label";
import { buttonVariants } from "~/components/ui/button";
// import useSWR from "swr";

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

  return data(
    {
      error: {
        server: session.get("error"),
      },
      ticketId,
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

  useEffect(() => {
    fetcher.submit(
      { ticketId: loaderData?.ticketId },
      { action: "/checkin/preview", method: "post" }
    );
  }, []);

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
              Preview Personal Information
            </h1>
            <p>Confirm personal details belong to user.</p>
          </div>

          <div className='p-8 bg-gray-50 rounded-2xl space-y-4'>
            <div className='grid gap-2'>
              <Label htmlFor='fullName'>Full Name</Label>
              <Input
                id='fullName'
                name='fullName'
                value={response?.attendee?.fullName}
                readOnly
                className='indent-2'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                value={response?.attendee?.email}
                readOnly
                className='indent-2'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='company'>Company</Label>
              <Input
                id='company'
                name='company'
                value={response?.company}
                readOnly
                className='indent-2'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='ticketClass'>Ticket Class</Label>
              <Input
                id='ticketClass'
                name='ticketClass'
                value={response?.ticketClass?.title}
                readOnly
                className='indent-2'
              />
            </div>

            <Link
              to={`/checkin/preview/print?ticketId=${loaderData?.ticketId}`}
              className={buttonVariants({
                className: "h-auto w-full py-3 mt-3",
              })}
              viewTransition
            >
              Continue
            </Link>
          </div>
        </div>
      </main>
    );
  }
}
