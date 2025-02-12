import { Link } from "react-router";
import logo from "./logo.svg";

export default function Header() {
  return (
    <header className='w-screen px-4 py-6 bg-white shadow-lg shadow-white/20 fixed top-0 left-0'>
      <nav className='flex items-center justify-between mx-auto max-w-screen-2xl w-full'>
        <Link to='/' className='max-w-[6.6rem] lg:max-w-[9.6rem] w-full'>
          <img src={logo} alt='Straqa' className='w-full' />
        </Link>

        <Link to='/logout' viewTransition>
          Logout
        </Link>
      </nav>
    </header>
  );
}
