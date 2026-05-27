import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/useInitials';
import { type User } from '@/types';

export function UserInfo({
  user,
  showEmail = false,
  showRole = false,
}: {
  user: User;
  showEmail?: boolean;
  showRole?: boolean;
}) {
  const getInitials = useInitials();
  return (
    <>
      <Avatar className="h-12 w-12 overflow-hidden rounded-full">
        <AvatarImage src={user.avatar_url || user.avatar} alt={user.name} />
        <AvatarFallback className="font-montserrat rounded-lg bg-primary text-lg font-semibold text-white">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="text-text-secondary font-montserrat truncate text-base font-semibold">
          {user.name}
        </span>
        {showEmail && <span className="text-text-primary truncate text-base">{user.email}</span>}
        {showRole && (
          <span className="text-text-primary text-base font-normal">
            {user.role_label || 'Employee'}
          </span>
        )}
      </div>
    </>
  );
}
