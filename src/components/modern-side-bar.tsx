"use client";
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Home,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  PlusCircle,
  Star,
  Trash2,
  Camera
} from 'lucide-react';
import { Button } from "./ui/button";

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

interface SidebarProps {
  className?: string;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

// Navigation items cho NoteArt
const navigationItems: NavigationItem[] = [
  { id: "dashboard", name: "Dashboard", icon: Home, href: "/notes" },
  { id: "create", name: "Tạo Note Mới", icon: PlusCircle, href: "/notes/create" },
  { id: "all-notes", name: "Tất cả Notes", icon: FileText, href: "/notes", badge: "12" },
  { id: "favorites", name: "Yêu thích", icon: Star, href: "/notes/favorites" },
  { id: "photos", name: "Hình ảnh", icon: Camera, href: "/notes/photos", badge: "5" },
  { id: "trash", name: "Thùng rác", icon: Trash2, href: "/notes/trash" },
  { id: "profile", name: "Hồ sơ", icon: User, href: "/profile" },
  { id: "settings", name: "Cài đặt", icon: Settings, href: "/settings" },
];

export function Sidebar({ className = "", searchQuery = "", setSearchQuery }: SidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");

  // Auto-open sidebar on desktop, auto-close on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
        setIsCollapsed(false);
      } else if (window.innerWidth >= 768) {
        setIsOpen(true);
        setIsCollapsed(true);
      } else {
        setIsOpen(false);
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleItemClick = (itemId: string, href?: string) => {
    setActiveItem(itemId);
    if (href) {
      navigate(href);
    }
    // Auto-close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <Button
        onClick={toggleSidebar}
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden shadow-lg active:scale-95"
        aria-label="Toggle sidebar"
      >
        {isOpen ?
          <X className="h-5 w-5" /> :
          <Menu className="h-5 w-5" />
        }
      </Button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && toggleSidebar()}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-50 transition-all duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-16" : "w-64"}
          lg:translate-x-0 lg:static lg:z-auto ${isCollapsed ? "lg:w-16" : "lg:w-64"}
          ${className}
        `}
      >
        {/* Header with logo and collapse button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/60">
          {!isCollapsed && (
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-base">🎨</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-800 text-base">NoteArt</span>
                <span className="text-xs text-slate-500">Ứng dụng ghi chú thông minh</span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto shadow-sm">
              <span className="text-white font-bold text-base">🎨</span>
            </div>
          )}

          {/* Desktop collapse button */}
          <Button
            onClick={toggleCollapse}
            variant="ghost"
            size="sm"
            className="hidden lg:flex p-1.5 h-8 w-8 active:scale-95"
            aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="px-3 py-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery?.(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-300 hover:bg-white hover:shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-1 overflow-y-auto">
          <ul className="space-y-0.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <li key={item.id}>
                  <Button
                    onClick={() => handleItemClick(item.id, item.href)}
                    variant={isActive ? "secondary" : "ghost"}
                    className={`
                      w-full justify-start h-10 text-left transition-all duration-300 group active:scale-95 hover:scale-[1.01]
                      ${isActive
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm hover:from-blue-50 hover:to-indigo-50"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                      ${isCollapsed ? "justify-center px-2" : "px-3 space-x-2.5"}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center justify-center min-w-[20px]">
                      <Icon
                        className={`
                          h-4 w-4 flex-shrink-0
                          ${isActive
                            ? "text-blue-600"
                            : "text-slate-500 group-hover:text-slate-700"
                          }
                        `}
                      />
                    </div>
                    
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-sm ${isActive ? "font-medium" : "font-normal"}`}>{item.name}</span>
                        {item.badge && (
                          <span className={`
                            px-1.5 py-0.5 text-xs font-medium rounded-full
                            ${isActive
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                            }
                          `}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Badge for collapsed state */}
                    {isCollapsed && item.badge && (
                      <div className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-blue-100 border border-white">
                        <span className="text-[10px] font-medium text-blue-700">
                          {parseInt(item.badge) > 9 ? '9+' : item.badge}
                        </span>
                      </div>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                        {item.name}
                        {item.badge && (
                          <span className="ml-1.5 px-1 py-0.5 bg-slate-700 rounded-full text-[10px]">
                            {item.badge}
                          </span>
                        )}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-800 rotate-45" />
                      </div>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section with profile and logout */}
        <div className="mt-auto border-t border-slate-200">
          {/* Profile Section */}
          <div className={`border-b border-slate-200 bg-slate-50/30 ${isCollapsed ? 'py-2.5 px-2' : 'p-2.5'}`}>
            {!isCollapsed ? (
              <div className="flex items-center px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-50 transition-all duration-300 hover:shadow-sm border border-slate-100">
                <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="text-slate-700 font-medium text-sm">
                    {loggedInUser?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0 ml-2">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {loggedInUser?.name || "Người dùng"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {loggedInUser?.email || "user@noteart.com"}
                  </p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full ml-2" title="Online" />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center">
                    <span className="text-slate-700 font-medium text-xs">
                      {loggedInUser?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="p-2.5">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className={`
                w-full justify-start rounded-md text-left transition-all duration-300 group h-auto hover:scale-105 active:scale-95
                text-red-600 hover:bg-red-50 hover:text-red-700
                ${isCollapsed ? "justify-center p-2" : "space-x-2 px-2.5 py-2"}
              `}
              title={isCollapsed ? "Đăng xuất" : undefined}
            >
              <div className="flex items-center justify-center min-w-[20px]">
                <LogOut className="h-4 w-4 flex-shrink-0 text-red-500 group-hover:text-red-600" />
              </div>
              
              {!isCollapsed && (
                <span className="text-sm">Đăng xuất</span>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  Đăng xuất
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-800 rotate-45" />
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

    </>
  );
}