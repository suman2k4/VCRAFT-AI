import { Link } from 'react-router-dom'

const AnalysisResult = ({ result }) => {
  const { overall_score, section_scores, feedback, recommendations, analysis_id } = result

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs Work'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Overall Score */}
      <div className="card mb-8 bg-gradient-to-br from-primary-50 to-indigo-50">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Analysis Complete
          </h2>
          <div className="inline-block">
            <div className={`text-6xl font-bold ${getScoreColor(overall_score)} px-8 py-4 rounded-2xl`}>
              {overall_score}
            </div>
            <p className="text-lg text-gray-600 mt-3">
              Overall Score - {getScoreLabel(overall_score)}
            </p>
          </div>
        </div>
      </div>

      {/* Section Scores */}
      <div className="card mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Section Breakdown
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(section_scores).map(([section, score]) => (
            <div key={section} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900 capitalize">
                  {section.replace(/_/g, ' ')}
                </h4>
                <span className={`text-2xl font-bold ${getScoreColor(score)} px-4 py-1 rounded-lg`}>
                  {score}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Feedback */}
      <div className="card mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Detailed Feedback
        </h3>
        
        <div className="space-y-6">
          {Object.entries(feedback).map(([section, text]) => (
            <div key={section} className="border-l-4 border-primary-500 pl-4">
              <h4 className="font-bold text-gray-900 mb-2 capitalize">
                {section.replace(/_/g, ' ')}
              </h4>
              <p className="text-gray-700 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="card mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Key Recommendations
          </h3>
          
          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">→</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link 
          to={`/qa/${analysis_id}`}
          className="btn-primary flex-1 text-center"
        >
          Practice VC Q&A
        </Link>
        <Link 
          to="/dashboard"
          className="btn-secondary flex-1 text-center"
        >
          View History
        </Link>
        <Link 
          to="/submit"
          className="btn-secondary flex-1 text-center"
        >
          New Analysis
        </Link>
      </div>
    </div>
  )
}

export default AnalysisResult
