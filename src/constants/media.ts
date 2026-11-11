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

  // Specific high-res image mapping by exact item name
  itemImages: {
    'Classic Espresso': 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80',
    'Cafe Cappuccino': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80',
    'Cortado': 'https://images.unsplash.com/photo-1534432182912-63863115e106?auto=format&fit=crop&w=600&q=80',
    'Flat White': 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=600&q=80',
    '18-Hour Cold Brew': 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    'Vietnamese Iced Coffee': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80',
    'Mango Passion Cooler': 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=600&q=80',
    'Sourdough Avocado Toast': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    'Truffle Scrambled Eggs': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    'Mediterranean Shakshuka': 'https://images.unsplash.com/photo-1590541547479-138386375bc1?auto=format&fit=crop&w=600&q=80',
    'Margherita Burrata Pizza': 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
    'Pepperoni & Hot Honey Pizza': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80',
    'Wild Mushroom Truffle Penne': 'https://images.unsplash.com/photo-1621996346565-e3d5d6281298?auto=format&fit=crop&w=600&q=80',
    'Spicy Arrabiata Spaghetti': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    'Truffle Parmesan Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
    'Peri Peri Chicken Skewers': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
    'Garlic Butter Crostini': 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=600&q=80',
    'Classic Tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
    'Belgian Chocolate Fondant': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    'Blueberry Almond Tart': 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=600&q=80',
  } as Record<string, string>,

  // Fallback images per item category/name if not explicitly mapped
  fallbackByKeyword: (name: string): string => {
    if (MediaAssets.itemImages[name]) {
      return MediaAssets.itemImages[name];
    }
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
    if (lower.includes('croissant') || lower.includes('pastry') || lower.includes('danish') || lower.includes('tart')) {
      return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80';
    }
    if (lower.includes('muffin') || lower.includes('cake') || lower.includes('brownie') || lower.includes('tiramisu')) {
      return 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&q=80';
    }
    if (lower.includes('sandwich') || lower.includes('toast') || lower.includes('avocado') || lower.includes('eggs')) {
      return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80';
    }
    if (lower.includes('pizza')) {
      return 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80';
    }
    if (lower.includes('pasta') || lower.includes('spaghetti') || lower.includes('penne')) {
      return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281298?auto=format&fit=crop&w=600&q=80';
    }
    if (lower.includes('tea') || lower.includes('matcha')) {
      return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80';
    }
    return 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80';
  },
};
