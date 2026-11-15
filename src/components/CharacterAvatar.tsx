import { ElementId, SkinAppearance } from '../types/game';
import { ELEMENTS } from '../data/gameData';

interface CharacterAvatarProps {
  appearance: SkinAppearance;
  element: ElementId;
  size?: number;
  className?: string;
}

export function CharacterAvatar({
  appearance,
  element,
  size = 120,
  className = '',
}: CharacterAvatarProps) {
  const accent = ELEMENTS[element].accentHex;
  const { skinTone, hairStyle, hairColor, outfitStyle, outfitColor, accessory } = appearance;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Портрет персонажа"
    >
      {/* Background plate */}
      <rect width="160" height="160" rx="20" fill="#F1F5F9" />
      <circle cx="80" cy="82" r="56" fill={accent} fillOpacity="0.1" />
      <circle
        cx="80"
        cy="82"
        r="56"
        stroke={accent}
        strokeOpacity="0.3"
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />

      {/* Back hair for long/curly */}
      {hairStyle === 'long' && (
        <path
          d="M46 66C46 44 62 34 80 34C98 34 114 44 114 66V112C114 116 105 118 100 112V86H60V112C55 118 46 116 46 112V66Z"
          fill={hairColor}
        />
      )}
      {hairStyle === 'curly' && (
        <g fill={hairColor}>
          <circle cx="50" cy="64" r="14" />
          <circle cx="110" cy="64" r="14" />
          <circle cx="52" cy="82" r="12" />
          <circle cx="108" cy="82" r="12" />
        </g>
      )}
      {hairStyle === 'bun' && <circle cx="80" cy="30" r="14" fill={hairColor} />}

      {/* Shoulders & Outfit */}
      <path
        d="M32 152C34 122 54 110 80 110C106 110 126 122 128 152H32Z"
        fill={outfitColor}
      />

      {/* Outfit variation details */}
      {outfitStyle === 'scholar' && (
        <>
          <path d="M62 112L80 138L98 112" fill="#F8FAFC" />
          <path d="M76 116L80 144L84 116Z" fill={accent} />
        </>
      )}
      {outfitStyle === 'warden' && (
        <>
          <path d="M48 116L68 152H92L112 116" stroke="#CBD5E1" strokeWidth="3" fill="none" />
          <circle cx="80" cy="128" r="5" fill={accent} />
        </>
      )}
      {outfitStyle === 'alchemist' && (
        <>
          <path d="M56 114L104 152" stroke="#FDE68A" strokeWidth="5" strokeLinecap="round" />
          <circle cx="94" cy="138" r="4" fill="#F59E0B" />
        </>
      )}
      {outfitStyle === 'navigator' && (
        <>
          <path d="M54 116H106L98 134H62L54 116Z" fill="#0F172A" fillOpacity="0.28" />
          <path d="M80 116V152" stroke="#E2E8F0" strokeWidth="2" />
        </>
      )}

      {/* Neck */}
      <rect x="71" y="96" width="18" height="20" rx="8" fill={skinTone} />

      {/* Scarf accessory */}
      {accessory === 'scarf' && (
        <path
          d="M58 108C66 118 94 118 102 108C104 116 98 126 80 126C62 126 56 116 58 108Z"
          fill={accent}
        />
      )}

      {/* Astrolabe amulet */}
      {accessory === 'astrolabe' && (
        <g>
          <path d="M66 112L80 132L94 112" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="80" cy="134" r="7" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
          <circle cx="80" cy="134" r="2.5" fill="#D97706" />
        </g>
      )}

      {/* Ears */}
      <circle cx="51" cy="74" r="6" fill={skinTone} />
      <circle cx="109" cy="74" r="6" fill={skinTone} />

      {/* Face */}
      <rect x="52" y="44" width="56" height="60" rx="26" fill={skinTone} />

      {/* Eyes */}
      <circle cx="67" cy="72" r="3.5" fill="#0F172A" />
      <circle cx="93" cy="72" r="3.5" fill="#0F172A" />
      <circle cx="68.2" cy="70.8" r="1.2" fill="#FFFFFF" />
      <circle cx="94.2" cy="70.8" r="1.2" fill="#FFFFFF" />

      {/* Brows */}
      <path d="M61 63Q67 60 73 63" stroke={hairColor} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M87 63Q93 60 99 63" stroke={hairColor} strokeWidth="2.2" strokeLinecap="round" />

      {/* Smile */}
      <path
        d="M73 86Q80 91 87 86"
        stroke="#9A5B4B"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Front Hair */}
      {hairStyle === 'short' && (
        <path
          d="M50 64C50 42 64 34 80 34C96 34 110 42 110 64C104 54 94 50 80 50C66 50 56 54 50 64Z"
          fill={hairColor}
        />
      )}
      {hairStyle === 'bob' && (
        <path
          d="M48 68C48 42 62 34 80 34C98 34 112 42 112 68V90C106 88 104 82 104 72C100 56 88 52 80 52C70 52 60 58 56 72C56 82 54 88 48 90V68Z"
          fill={hairColor}
        />
      )}
      {hairStyle === 'long' && (
        <path
          d="M50 64C52 44 65 36 80 36C95 36 108 44 110 64C100 54 90 50 80 52C70 50 60 54 50 64Z"
          fill={hairColor}
        />
      )}
      {hairStyle === 'bun' && (
        <path
          d="M52 64C52 44 64 36 80 36C96 36 108 44 108 64C100 52 90 48 80 48C70 48 60 52 52 64Z"
          fill={hairColor}
        />
      )}
      {hairStyle === 'curly' && (
        <g fill={hairColor}>
          <circle cx="62" cy="44" r="11" />
          <circle cx="80" cy="40" r="12" />
          <circle cx="98" cy="44" r="11" />
        </g>
      )}

      {/* Glasses accessory */}
      {accessory === 'glasses' && (
        <g stroke="#B45309" strokeWidth="2.2" fill="#FFFFFF" fillOpacity="0.2">
          <circle cx="67" cy="72" r="9.5" />
          <circle cx="93" cy="72" r="9.5" />
          <line x1="76.5" y1="72" x2="83.5" y2="72" />
        </g>
      )}

      {/* Crown accessory */}
      {accessory === 'crown' && (
        <path
          d="M58 42L64 28L74 36L80 24L86 36L96 28L102 42H58Z"
          fill="#10B981"
          stroke="#065F46"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
