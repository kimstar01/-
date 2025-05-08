import { Link } from "wouter";
import {
  Instagram,
  Facebook,
  Youtube,
  MessageCircle
} from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-neutral-800 text-white py-10 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4">체험썸</h3>
            <p className="text-neutral-400 text-sm">최고의 체험단 서비스를 통해 브랜드와 인플루언서를 연결합니다.</p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-white hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-white hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-white hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="text-white hover:text-primary transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">체험단</h4>
            <ul className="space-y-2 text-neutral-400">
              <li><Link href="/guide" className="hover:text-white transition-colors">체험단 신청방법</Link></li>
              <li><Link href="/influencer-guide" className="hover:text-white transition-colors">인플루언서 가이드</Link></li>
              <li><Link href="/review-guide" className="hover:text-white transition-colors">리뷰 작성법</Link></li>
              <li><Link href="/points" className="hover:text-white transition-colors">포인트 정책</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">자주 묻는 질문</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">광고주</h4>
            <ul className="space-y-2 text-neutral-400">
              <li><Link href="/advertiser-guide" className="hover:text-white transition-colors">광고 등록 방법</Link></li>
              <li><Link href="/advertiser-rules" className="hover:text-white transition-colors">광고주 가이드</Link></li>
              <li><Link href="/success-cases" className="hover:text-white transition-colors">성공 사례</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">서비스 요금</Link></li>
              <li><Link href="/resources" className="hover:text-white transition-colors">자료실</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">고객센터</h4>
            <ul className="space-y-2 text-neutral-400">
              <li><Link href="/notice" className="hover:text-white transition-colors">공지사항</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">1:1 문의</Link></li>
              <li><Link href="/partnership" className="hover:text-white transition-colors">제휴 문의</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">이용약관</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-700 mt-10 pt-6 text-neutral-500 text-sm">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-4 md:mb-0">
              <p>㈜체험썸 | 대표: 홍길동 | 사업자등록번호: 123-45-67890</p>
              <p>서울특별시 강남구 테헤란로 123, 체험썸빌딩 8층</p>
              <p>고객센터: 02-123-4567 (평일 10:00 ~ 18:00, 점심시간 12:00 ~ 13:00)</p>
            </div>
            <div>
              <p>© 2023 체험썸. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
