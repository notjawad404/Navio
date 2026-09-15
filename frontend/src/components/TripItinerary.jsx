import TripMap from './TripMap'
import DayCard from './DayCard'
import { dayWaypoints } from '../lib/itinerary'

export default function TripItinerary({ plan }) {
  const hasMap  = (plan.days || []).some(day => dayWaypoints(day).length > 0)
  const hasTips = plan.generalTips?.length > 0

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-5 lg:items-start">
      {hasMap && (
        <div className="isolate lg:col-span-2 lg:order-last lg:sticky lg:top-24">
          <TripMap days={plan.days} />
        </div>
      )}

      <div className={`flex flex-col gap-6 ${hasMap ? 'lg:col-span-3' : 'lg:col-span-5'}`}>
        {plan.days?.map(day => <DayCard key={day.day} day={day} />)}

        {(hasTips || plan.estimatedCost) && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
            {hasTips && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📌</span> Travel Tips
                </h3>
                <ul className="flex flex-col gap-2">
                  {plan.generalTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-indigo-400 font-bold mt-0.5">·</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {plan.estimatedCost && (
              <div className={hasTips ? 'border-t border-gray-100 pt-4' : ''}>
                <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <span>💵</span> Estimated Cost
                </h3>
                <p className="text-sm text-gray-600">{plan.estimatedCost}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
