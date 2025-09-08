import {ComponentPropsWithoutRef} from 'react';
import {NavigationMenuLink} from '@/components/ui/navigation-menu.tsx';
import {Link} from 'react-router-dom';

export default function MenuBarListItem({
  title,
  children,
  to,
  ...props}: ComponentPropsWithoutRef<'li'> & { to: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link to={to}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}