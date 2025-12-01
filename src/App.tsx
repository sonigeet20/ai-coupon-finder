import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { SavedPage } from './pages/SavedPage';
import { BrandsPage } from './pages/BrandsPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [blogSlug, setBlogSlug] = useState('');

  const handleNavigate = (page: string, query?: string, category?: string) => {
    setCurrentPage(page);
    if (query !== undefined) {
      if (page === 'blog-post') {
        setBlogSlug(query);
      } else {
        setSearchQuery(query);
      }
    }
    if (category !== undefined) setSearchCategory(category);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'search':
        return <SearchPage initialSearch={searchQuery} initialCategory={searchCategory} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'signup':
        return <SignUpPage onNavigate={handleNavigate} />;
      case 'saved':
        return <SavedPage />;
      case 'brands':
        return <BrandsPage />;
      case 'admin':
        return <AdminPage />;
      case 'profile':
        return <ProfilePage />;
      case 'blog':
        return <BlogPage onNavigate={handleNavigate} />;
      case 'blog-post':
        return <BlogPostPage slug={blogSlug} onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <AuthProvider>
      <LocationProvider>
        <div className="min-h-screen bg-gray-50">
          {currentPage !== 'login' && currentPage !== 'signup' && (
            <Header onNavigate={handleNavigate} currentPage={currentPage} />
          )}
          {renderPage()}
        </div>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
