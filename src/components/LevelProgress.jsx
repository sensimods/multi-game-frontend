import React from "react"

const LevelProgress = ({ level, currentXP, nextLevelXP }) => {
  const radius = 30 // Circle size
  const strokeWidth = 6
  const circumference = 2 * Math.PI * radius
  const progress = Math.min((currentXP / nextLevelXP) * circumference, circumference)

  return (
    <div style={{ position: "relative", width: "70px", height: "70px" }} title={`${currentXP} XP / ${nextLevelXP} XP`}>
      <svg width="70" height="70" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
        {/* Background Circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#2D2D2D"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#BE44FC"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.5s ease-in-out"
          }}
        />
      </svg>
      {/* Level Number in Center */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "20px",
          fontWeight: "bold",
          color: "#FFFFFF"
        }}
      >
        {level}
      </div>
    </div>
  )
}

export default LevelProgress
