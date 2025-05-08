import React from 'react';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          체험단 사이트
        </h1>
        <p className="text-gray-600">
          환영합니다! 이 사이트는 체험단 모집 및 관리 시스템입니다.
        </p>
      </div>
    </div>
  );
};
