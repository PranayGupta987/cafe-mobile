/**
 * Curated high-resolution artisanal coffee & gourmet café photography.
 * Hand-picked from Unsplash with optimized responsive CDN URLs and fallback tokens.
 */
export const MediaAssets = {
  // Hero Banners
  heroes: {
    pourOver: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
    latteArt: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
    bakeryDisplay: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80',
    coldBrew: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1200&q=80',
    cafeInterior: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
  },

  // Daily Story Highlights (Pinterest / Instagram Boutique Café style)
  stories: [
    {
      id: 'story-1',
      title: 'Bean Origin',
      subtitle: 'Ethiopia Yirgacheffe',
      image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=300&q=80',
      tag: 'Single Origin',
    },
    {
      id: 'story-2',
      title: 'Latte Art',
      subtitle: 'Barista Series',
      image: 'https://images.unsplash.com/photo-1534432182912-63863115e106?auto=format&fit=crop&w=300&q=80',
      tag: 'Craft',
    },
    {
      id: 'story-3',
      title: 'Fresh Bakes',
      subtitle: 'Morning Batch 07:00',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
      tag: 'Warm Pastry',
    },
    {
      id: 'story-4',
      title: 'Cold Brew Bar',
      subtitle: '18hr Slow Steep',
      image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=300&q=80',
      tag: 'Reserve',
    },
    {
      id: 'story-5',
      title: 'Matcha Ritual',
      subtitle: 'Uji Ceremonial Grade',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=300&q=80',
      tag: 'Botanical',
    },
  ],

  // Fallback images per item category/name if backend has none
  fallbackByKeyword: (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('latte') || lower.includes('flat white')) {
      return 'https://images.unsplash.com/photo-1534432182912-63863115e106?auto=format&fit=crop&w=600&q=80';
    }
    if (lower.includes('cappuccino')) {
      return 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80';
    }
    if (lower.includes('espresso') || lower.includes('americano')) {
      return 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80';
    }
    if (lower.includes('cold brew') || lower.includes('iced')) {
      return 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80';
    }
    if (lower.includes('croissant') || lower.includes('pastry') || lower.includes('danish')) {
      return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80';
    }
    if (lower.includes('muffin') || lower.includes('cake') || lower.includes('brownie')) {
      return 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&q=80';
    }
    if (lower.includes('sandwich') || lower.includes('toast') || lower.includes('avocado')) {
      return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80';
    }
    if (lower.includes('tea') || lower.includes('matcha')) {
      return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80';
    }
    return 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80';
  },
};
