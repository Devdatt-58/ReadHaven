'use client';

export default function ScrollToSearchButton() {
  const scrollToSearch = () => {
    const searchSection = document.querySelector('.search-browse-section');
    if (searchSection) {
      searchSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <button
      onClick={scrollToSearch}
      className="scroll-to-search-btn"
      aria-label="Jump to search"
      title="Jump to search"
    >
      <i className="fas fa-search"></i>
    </button>
  );
}
