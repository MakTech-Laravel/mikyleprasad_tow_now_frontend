import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';

export function SearchBar() {
  return (
    <div className="relative max-w-sm flex-1 md:flex-grow-0">
      <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search..."
        className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[310px]"
      />
    </div>
  );
}
