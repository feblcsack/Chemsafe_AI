'use client';

import Link from 'next/link';

interface QuickActionButton {
  href: string;
  emoji: string;
  title: string;
  description: string;
  gradient: string;
  hoverGradient: string;
  textColor: string;
}

interface QuickActionButtonsProps {
  actions?: QuickActionButton[];
}

const defaultActions: QuickActionButton[] = [
  {
    href: '/worker/hazdex',
    emoji: '🎴',
    title: 'My Hazdex',
    description: 'Koleksi Hazmon',
    gradient: 'from-purple-600 to-blue-600',
    hoverGradient: 'from-purple-700 to-blue-700',
    textColor: 'text-purple-200',
  },
  {
    href: '/worker/scan',
    emoji: '🔍',
    title: 'Scan Label',
    description: 'GHS Detection',
    gradient: 'from-orange-600 to-red-600',
    hoverGradient: 'from-orange-700 to-red-700',
    textColor: 'text-orange-200',
  },
];

export default function QuickActionButtons({ actions = defaultActions }: QuickActionButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {actions.map((action, index) => (
        <Link key={index} href={action.href}>
          <button 
            className={`w-full bg-gradient-to-br ${action.gradient} hover:${action.hoverGradient} rounded-xl p-4 text-left transition-all hover:scale-105 shadow-lg active:scale-100`}
          >
            <div className="text-white text-3xl mb-2">{action.emoji}</div>
            <h3 className="text-white text-sm font-bold mb-1">{action.title}</h3>
            <p className={`${action.textColor} text-xs`}>
              {action.description}
            </p>
          </button>
        </Link>
      ))}
    </div>
  );
}

// Export pre-configured button sets for different contexts
export const workerQuickActions: QuickActionButton[] = [
  {
    href: '/worker/hazdex',
    emoji: '🎴',
    title: 'My Hazdex',
    description: 'Koleksi Hazmon',
    gradient: 'from-purple-600 to-blue-600',
    hoverGradient: 'from-purple-700 to-blue-700',
    textColor: 'text-purple-200',
  },
  {
    href: '/worker/scan',
    emoji: '🔍',
    title: 'Scan Label',
    description: 'GHS Detection',
    gradient: 'from-orange-600 to-red-600',
    hoverGradient: 'from-orange-700 to-red-700',
    textColor: 'text-orange-200',
  },
];

export const householdQuickActions: QuickActionButton[] = [
  {
    href: '/hazdex',
    emoji: '🎴',
    title: 'My Hazdex',
    description: 'Chemical Collection',
    gradient: 'from-purple-600 to-blue-600',
    hoverGradient: 'from-purple-700 to-blue-700',
    textColor: 'text-purple-200',
  },
  {
    href: '/scan',
    emoji: '🔍',
    title: 'Scan Label',
    description: 'GHS Detection',
    gradient: 'from-orange-600 to-red-600',
    hoverGradient: 'from-orange-700 to-red-700',
    textColor: 'text-orange-200',
  },
];
