import * as React from 'react';
import { useSession } from 'next-auth/react';

export const useUserInfo = (): { userName: string; userImage: string } => {
  const { data: session } = useSession();
  const [userName, setUserName] = React.useState<string>('');
  const [userImage, setUserImage] = React.useState<string>('');

  React.useEffect(() => {
    if (session?.user?.name === 'Admin') {
      setUserName(session?.user?.name);
      setUserImage('/default-avatar.png');
    } else {
      setUserName(session?.user?.name ?? '');
      setUserImage(session?.user?.image || '');
    }
  }, [session?.user?.name, session?.user?.image]);

  return { userName, userImage };
};
