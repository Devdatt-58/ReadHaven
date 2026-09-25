import AwardsPageClient from './AwardsPageClient';

interface PageProps {
  params: Promise<{
    category: string;
  }>;
}

function formatCategoryName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/\bAnd\b/g, '&');
}

export default async function AwardsPage({ params }: PageProps) {
  const { category } = await params;
  const categoryName = formatCategoryName(category);

  return <AwardsPageClient category={categoryName} />;
}
