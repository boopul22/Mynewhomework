import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbProps {
  homeElement?: React.ReactNode;
  separator?: React.ReactNode;
  containerClasses?: string;
  listClasses?: string;
  activeClasses?: string;
  capitalizeLinks?: boolean;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  homeElement = 'Home',
  separator = '/',
  containerClasses = 'flex py-5 px-4',
  listClasses = 'hover:text-blue-600',
  activeClasses = 'text-gray-500',
  capitalizeLinks = true,
}) => {
  const paths = usePathname();
  const pathNames = paths.split('/').filter((path) => path);

  // Generate schema markup
  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: pathNames.map((path, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@id': `/${pathNames.slice(0, index + 1).join('/')}`,
        name: capitalizeLinks ? path.charAt(0).toUpperCase() + path.slice(1) : path,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      <nav aria-label="breadcrumb" className={containerClasses}>
        <ol className="flex items-center space-x-4">
          <li className={listClasses}>
            <Link href="/">{homeElement}</Link>
          </li>
          {pathNames.map((name, index) => {
            const routeTo = `/${pathNames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathNames.length - 1;

            return (
              <li key={routeTo} className="flex items-center space-x-4">
                <span className="text-gray-400 mx-2">{separator}</span>
                {isLast ? (
                  <span className={activeClasses}>
                    {capitalizeLinks ? name.charAt(0).toUpperCase() + name.slice(1) : name}
                  </span>
                ) : (
                  <Link href={routeTo} className={listClasses}>
                    {capitalizeLinks ? name.charAt(0).toUpperCase() + name.slice(1) : name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};
