import type { Route } from "./+types/checkin";

import search from "./search.png";
import qrcode from "./qrcode.png";
import { Link } from "react-router";

export default function Welcome() {
  return (
    <main className='flex items-center justify-center pt-16 pb-4 bg-[hsla(207,_82%,_4%,_1)] min-h-dvh'>
      <div className='space-y-16 max-w-4xl mx-auto text-white'>
        <div className='space-y-2 text-center text-balance p-4'>
          <h1 className='font-mono text-4xl md:text-5xl lg:text-6xl xl:text-7xl'>
            AFRICA TECHNOLOGY EXPO
          </h1>
          <p className='lg:text-lg xl:text-xl text-balance'>
            The Africa Technology Expo (ATE) is where Africa’s tech and business
            leaders gather with one clear goal: to make deals happen. It’s a
            space where enterprises, operators, and industry giants converge to
            showcase innovations, build partnerships, and deliver results.
          </p>
        </div>

        <div className='flex gap-8 justify-center'>
          {methods?.map((method, index) => (
            <Link
              key={index}
              to={`/checkin/${method.method}`}
              className='flex flex-col items-center justify-end lg:justify-center space-y-4 aspect-square bg-white text-black size-36 lg:size-64 rounded-2xl lg:rounded-3xl'
              viewTransition
            >
              <img
                src={method.image}
                alt='search'
                className='size-28 lg:size-44'
              />
              <p className='text-sm text-center lg:text-base px-2 pb-2 lg:pb-0'>
                {method.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

const methods = [
  {
    method: "qrcode",
    title: "Pickup tag with QR Code",
    image: qrcode,
  },
  {
    method: "search",
    title: "Pickup tag with Search",
    image: search,
  },
];
