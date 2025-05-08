import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Bell, Menu, Search, User, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // 알림 데이터 가져오기
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user, // 로그인 했을 때만 쿼리 실행
  });
  
  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter((note) => !note.isRead).length;
  
  // 스크롤 이벤트 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation("/");
  };
  
  return (
    <header className={`sticky top-0 z-50 bg-white ${isScrolled ? 'shadow-md' : 'shadow-sm'} transition-shadow duration-300`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="font-bold text-2xl text-primary mr-8">
              체험썸
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="font-medium hover:text-primary transition-colors">
                홈
              </Link>
              {user?.role === 'influencer' && (
                <Link href="/my-campaigns" className="font-medium hover:text-primary transition-colors">
                  내 체험
                </Link>
              )}
              {user?.role === 'advertiser' && (
                <Link href="/dashboard" className="font-medium hover:text-primary transition-colors">
                  광고 관리
                </Link>
              )}
              <Link href="/#popular" className="font-medium hover:text-primary transition-colors">
                인기 체험
              </Link>
              <Link href="/#new" className="font-medium hover:text-primary transition-colors">
                신규 체험
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="py-2 px-4 border rounded-full flex items-center w-64">
                    <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">체험을 검색해보세요</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>검색</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center gap-2">
                    <Input placeholder="검색어를 입력하세요" className="flex-1" />
                    <Button>검색</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {user ? (
              <>
                <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative p-2">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge className="notification-badge bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>알림</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        알림이 없습니다
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((note: any) => (
                        <DropdownMenuItem key={note.id} className="py-3 cursor-pointer">
                          <div className={`${note.isRead ? 'text-muted-foreground' : 'font-medium'}`}>
                            <p>{note.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(note.createdAt).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="justify-center text-primary">
                      모든 알림 보기
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-1">
                      <Avatar>
                        <AvatarImage src={user.profileImage || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.name?.charAt(0) || user.username?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.role === 'influencer' ? (
                      <DropdownMenuItem asChild>
                        <Link href="/my-campaigns">내 체험</Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">광고 관리</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/profile">프로필 설정</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="outline" className="rounded-full hidden md:flex">
                    <User className="h-4 w-4 mr-2" />
                    로그인
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className="rounded-full hidden md:flex">
                    <UserPlus className="h-4 w-4 mr-2" />
                    회원가입
                  </Button>
                </Link>
              </>
            )}
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="text-primary text-xl">체험썸</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="체험을 검색해보세요" className="pl-9" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-3">
                    <SheetClose asChild>
                      <Link href="/" className="py-2 font-medium hover:text-primary transition-colors">
                        홈
                      </Link>
                    </SheetClose>
                    
                    {user?.role === 'influencer' && (
                      <SheetClose asChild>
                        <Link href="/my-campaigns" className="py-2 font-medium hover:text-primary transition-colors">
                          내 체험
                        </Link>
                      </SheetClose>
                    )}
                    
                    {user?.role === 'advertiser' && (
                      <SheetClose asChild>
                        <Link href="/dashboard" className="py-2 font-medium hover:text-primary transition-colors">
                          광고 관리
                        </Link>
                      </SheetClose>
                    )}
                    
                    <SheetClose asChild>
                      <Link href="/#popular" className="py-2 font-medium hover:text-primary transition-colors">
                        인기 체험
                      </Link>
                    </SheetClose>
                    
                    <SheetClose asChild>
                      <Link href="/#new" className="py-2 font-medium hover:text-primary transition-colors">
                        신규 체험
                      </Link>
                    </SheetClose>
                  </div>
                  
                  <div className="mt-auto space-y-4">
                    {user ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                          <Avatar>
                            <AvatarImage src={user.profileImage || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.name?.charAt(0) || user.username?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.role === 'influencer' ? '인플루언서' : '광고주'}</div>
                          </div>
                        </div>
                        <Button variant="outline" onClick={handleLogout}>로그아웃</Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <SheetClose asChild>
                          <Link href="/auth">
                            <Button variant="outline" className="w-full">
                              <User className="h-4 w-4 mr-2" />
                              로그인
                            </Button>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link href="/auth">
                            <Button className="w-full">
                              <UserPlus className="h-4 w-4 mr-2" />
                              회원가입
                            </Button>
                          </Link>
                        </SheetClose>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
