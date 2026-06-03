import React, { useState } from "react";

export default function CustomBody() {
  const [selectedZones, setSelectedZones] = useState([]);

  const toggleZone = (id) => {
    setSelectedZones((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col items-center p-8 bg-slate-50 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="font-bold text-slate-800 mb-4">Right Leg & Ankle Demo</h3>
      
      <style>{`
        .svg-body-part {
          fill: #1f3b5a;
          stroke: #8fb8ff;
          stroke-width: 1.5px;
          transition: fill 0.2s ease, stroke 0.2s ease;
          cursor: pointer;
          /* This ensures hover ONLY triggers on the actual colored shape, not the bounding box */
          pointer-events: visiblePainted; 
        }
        .svg-body-part:hover {
          fill: rgba(13, 148, 136, 0.4); /* Teal hover */
          stroke: #0D9488;
        }
        .svg-body-part.selected {
          fill: rgba(13, 148, 136, 0.7); /* Teal selected */
          stroke: #0D9488;
          stroke-width: 2px;
        }
      `}</style>

      {/* Combined ViewBox bounds approx: x=50, y=340, width=90, height=230 */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="50 340 90 230"
        style={{ width: "150px", height: "auto" }}
      >
        {/* Right Leg */}
        <path
          className={`svg-body-part ${selectedZones.includes("right_leg") ? "selected" : ""}`}
          d="M78.6099,349.1793 C78.7079,350.0543 78.7999,350.9263 78.9079,351.8043 C81.2269,370.7443 84.4409,390.2703 85.7809,398.1623 C85.6589,400.0823 85.4949,402.2823 85.2689,404.8043 C84.2689,415.9713 81.2689,425.8043 82.9359,446.8043 C83.5729,454.8323 84.8439,462.3943 86.2449,469.4603 C90.3809,470.7133 96.4549,471.9713 104.1859,471.9713 C110.9849,471.9713 116.4979,470.9983 120.5429,469.9113 C125.4909,428.8343 123.4589,418.2623 121.2689,412.5543 C123.0189,406.5543 123.6979,399.4433 123.2689,392.5543 C123.3609,386.0273 122.5719,376.9433 123.6579,367.3043 C124.3519,361.1493 125.1049,355.9063 125.8459,351.0543 C112.6819,355.9713 93.9709,355.4853 78.6099,349.1793"
          onClick={() => toggleZone("right_leg")}
        />

        {/* Right Ankle & Foot */}
        <path
          className={`svg-body-part ${selectedZones.includes("right_ankle") ? "selected" : ""}`}
          d="M86.2451,469.4606 C88.5091,480.8756 91.1121,490.9896 91.9351,499.6376 C93.2691,513.6376 94.2691,525.1376 92.2691,531.9716 C91.9931,532.9136 91.7631,533.8046 91.5701,534.6506 C90.5161,535.6466 89.2381,536.9856 88.1021,538.4716 C85.9351,541.3046 85.4351,541.9716 81.4351,543.4716 C77.4351,544.9716 74.2271,546.6166 72.0401,548.4296 C69.8521,550.2416 68.3521,550.7416 67.1021,550.9916 C65.8521,551.2416 63.4151,551.3666 62.3521,553.8046 C61.2901,556.2416 63.5401,557.6166 65.4771,557.1796 C65.7881,557.1086 66.0761,556.9786 66.3521,556.8256 C66.6251,557.7656 67.3771,558.5916 68.4771,558.5546 C69.7251,558.5126 70.4801,558.2026 71.0631,557.7546 C71.1311,558.4696 71.4431,559.1466 72.0401,559.6166 C72.9531,560.3376 74.8771,560.3766 76.5311,559.3146 C76.6461,559.7106 76.8471,560.0796 77.1651,560.3666 C78.3571,561.4446 80.9851,561.6326 83.0511,560.5376 C83.6001,561.7126 84.9001,562.9626 87.9151,562.8046 C92.6651,562.5546 95.7901,559.9296 99.2271,557.5546 C102.6651,555.1796 104.9771,554.1796 110.2271,553.3046 C115.4771,552.4296 116.3521,548.0546 114.3521,541.9296 C112.5911,536.5346 114.8001,534.5796 113.4321,530.2626 C113.2701,522.6876 113.9551,516.3556 115.2691,507.8046 C117.5581,492.8966 119.2781,480.4076 120.5431,469.9116 C116.4981,470.9986 110.9841,471.9716 104.1851,471.9716 C96.4551,471.9716 90.3811,470.7136 86.2451,469.4606"
          onClick={() => toggleZone("right_ankle")}
        />
      </svg>
      
      <p className="text-sm mt-4 text-slate-500 text-center font-medium">
        Pure CSS Hover: Only lights up the exact SVG shape.
      </p>
    </div>
  );
}
