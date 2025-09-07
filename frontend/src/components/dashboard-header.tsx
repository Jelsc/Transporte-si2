import { Bell, HelpCircle, MessageCircle } from 'lucide-react';
import { NavUserHeader } from '@/components/nav-user-header';

export function Header() {
  return (
    <header className="h-[64px] bg-white dark:bg-gray-900 border-b dark:border-gray-800 flex items-center justify-between px-[32px]">
        <div className="flex items-center"></div>{ /* left????? */}
        <div className="flex items-center  space-x-4">
            <div className="flex items-center">
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <HelpCircle className="size-5 text-gray-500" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <Bell className="size-5 text-gray-500" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <MessageCircle className="size-5 text-gray-500" />
                </button>
            </div>
            <NavUserHeader />
        </div>
    </header>
  );
}
