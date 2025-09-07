
import React, { useContext } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { ChevronUp } from 'lucide-react';
import { useUser } from "../context/UserContext";

export function NavUserHeader() {
    const user = useUser();
    const isMobile = window.innerWidth < 768;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center px-[16px] py-2 rounded-md bg-gray-100">
                    <UserInfo user={user} />
                    <ChevronUp className="ml-2 size-6" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="min-w-56 rounded-lg"
                align="end"
                side={isMobile ? 'bottom' : 'bottom'}
            >
                <UserMenuContent user={user ?? { name: "Invitado" }} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
