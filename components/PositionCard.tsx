interface PositionCardProps {
  position: string
  preference: 'primary' | 'secondary' | null
  onPreferenceChange: (preference: 'primary' | 'secondary' | null) => void
  isDarkMode: boolean
}

export function PositionCard({ position, preference, onPreferenceChange, isDarkMode }: PositionCardProps) {
  const getPreferenceColor = (pref: 'primary' | 'secondary' | null) => {
    if (pref === 'primary') return 'bg-blue-500 text-white border-blue-600'
    if (pref === 'secondary') return 'bg-gray-500 text-white border-gray-600'
    return isDarkMode 
      ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' 
      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
  }

  const cyclePreference = () => {
    if (preference === null) onPreferenceChange('secondary')
    else if (preference === 'secondary') onPreferenceChange('primary')
    else onPreferenceChange(null)
  }

  return (
    <div 
      onClick={cyclePreference}
      className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-105 ${getPreferenceColor(preference)}`}
    >
      <div className="text-center">
        <div className="font-semibold">{position}</div>
        <div className="text-sm opacity-80 mt-1">
          {preference === 'primary' && 'Primary'}
          {preference === 'secondary' && 'Secondary'}
          {preference === null && 'No preference'}
        </div>
      </div>
    </div>
  )
}
