import Link from 'next/link';

interface TopNavLink {
  href: string;
  label: string;
}

interface TopNavProps {
  links: TopNavLink[];
  activeHref: string;
}

function getLinkClass(isActive: boolean) {
  if (isActive) {
    return 'block whitespace-nowrap rounded-md px-3 py-2 text-green-400 bg-gray-700/70 font-medium text-sm sm:text-base';
  }

  return 'block whitespace-nowrap rounded-md px-3 py-2 text-gray-300 hover:text-green-400 hover:bg-gray-700/60 font-medium text-sm sm:text-base';
}

export default function TopNav({ links, activeHref }: TopNavProps) {
  return (
    <>
      <details className="relative sm:hidden w-full">
        <summary className="list-none rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-gray-100 cursor-pointer select-none">
          Menu
        </summary>
        <div className="absolute right-0 mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 p-2 shadow-xl z-20">
          <div className="space-y-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={getLinkClass(link.href === activeHref)}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </details>

      <nav className="hidden sm:flex w-full items-center gap-1 sm:w-auto sm:justify-end">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={getLinkClass(link.href === activeHref)}>
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
