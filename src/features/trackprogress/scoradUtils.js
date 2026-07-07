// SCORAD utility functions and constants
// PO-SCORAD = Patient-Oriented SCORing Atopic Dermatitis

// Maps each body part ID to its percentage of total body surface area (BSA)
// Used to calculate the "Extent" portion of the SCORAD formula
export const SCORAD_AREA_MAP = {
  F_head: 4.5,
  F_upperTorso: 6,
  F_lowerTorso: 6,
  F_waist: 6,
  F_genitals: 1,
  F_rightShoulder: 1,
  F_rightUpperArm: 1.25,
  F_rightForearm: 1.5,
  F_rightPalm: 0.75,
  F_leftShoulder: 1,
  F_leftUpperArm: 1.25,
  F_leftForearm: 1.5,
  F_leftPalm: 0.75,
  F_rightThigh: 4,
  F_rightLeg: 4,
  F_rightFoot: 1,
  F_leftThigh: 4,
  F_leftLowerLeg: 4,
  F_leftFoot: 1,

  B_head: 4.5,
  B_upperTorso: 6,
  B_lowerTorso: 6,
  B_waist: 6,
  B_rightShoulder: 1,
  B_rightUpperArm: 1.25,
  B_rightForearm: 1.5,
  B_rightPalm: 0.75,
  B_leftShoulder: 1,
  B_leftUpperArm: 1.25,
  B_leftForearm: 1.5,
  B_leftPalm: 0.75,
  B_buttocks: 8,
  B_buttocksLine: 0,
  B_rightLeg: 4,
  B_rightFoot: 1,
  B_leftLowerLeg: 4,
  B_leftFoot: 1,
};

// Calculate total affected body surface area percentage from selected parts
export const calculateSCORADArea = (selectedParts) => {
  let area = 0;
  selectedParts.forEach(part => {
    area += (SCORAD_AREA_MAP[part] || 0);
  });
  return Math.min(area, 100);
};

// Generate personalized recommendations based on SCORAD scores and symptoms
export const getRecommendations = (score, skin, itch, sleep, triggers, foods, medications) => {
  const recs = [];
  const urgent = [];

  // Urgent actions for severe/moderate cases
  if (score > 50) {
    urgent.push("Book an appointment with your dermatologist as soon as possible.");
    urgent.push("Consider visiting urgent care if symptoms are worsening rapidly.");
    if (medications.length === 0) urgent.push("You have no medications logged — consult your doctor about a treatment plan.");
  } else if (score >= 26) {
    urgent.push("Schedule a follow-up appointment to review your treatment plan.");
    if (medications.filter(m => m.status === 'ongoing').length === 0) urgent.push("No active medications logged — discuss options with your doctor.");
  }

  // Specific recommendations based on individual symptom scores
  if (skin.dryness >= 2) recs.push("Apply a thick emollient moisturizer at least 2–3 times today, especially after bathing.");
  if (skin.redness >= 2) recs.push("Use a cold compress on inflamed areas for 10–15 minutes to reduce redness.");
  if (skin.oozing >= 2) recs.push("Keep oozing areas clean and dry. Apply antiseptic cream and cover with a sterile dressing.");
  if (skin.scratch >= 2) recs.push("Trim your nails short and consider wearing cotton gloves at night to prevent scratching.");
  if (skin.lichenification >= 2) recs.push("Discuss prescription-strength treatment for thickened skin areas with your doctor.");
  if (itch >= 7) recs.push("Take a lukewarm oatmeal bath to soothe severe itching. Avoid hot water.");
  if (itch >= 5) recs.push("Consider an antihistamine before bedtime to manage itching.");
  if (sleep >= 6) recs.push("Use breathable cotton bedsheets and keep your bedroom cool (18–20°C) for better sleep.");
  if (triggers.includes("Heat") || triggers.includes("Sweat")) recs.push("Stay in cool environments and wear loose, breathable clothing today.");
  if (triggers.includes("Stress")) recs.push("Practice relaxation techniques — try 10 minutes of deep breathing or meditation.");
  if (triggers.includes("Dust")) recs.push("Vacuum your living space and use hypoallergenic pillow covers.");
  if (foods.length > 0) recs.push(`Monitor your reaction to today's dietary triggers: ${foods.join(", ")}.`);
  if (recs.length === 0) recs.push("Keep up your current skincare routine — your symptoms are well managed!");

  return { urgent, recs };
};

// Generate AI insight text based on SCORAD score severity
export const getAiInsight = (score, skin, itch, sleep) => {
  if (score > 50) return "Your PO-SCORAD score indicates severe eczema. This level of severity typically requires medical intervention. Your symptoms suggest active inflammation that may benefit from prescription-strength topical corticosteroids or immunomodulators. Please prioritize seeing your dermatologist.";
  if (score >= 40) return "Your eczema is in the moderate-to-severe range. The combination of your clinical signs suggests ongoing inflammation. Focus on consistent moisturizing, trigger avoidance, and consider discussing a step-up in your treatment plan with your doctor.";
  if (score >= 26) return "Your PO-SCORAD indicates moderate eczema. While manageable, your symptoms would benefit from a structured care routine. Pay attention to your identified triggers and maintain regular moisturizing to prevent flare-ups.";
  if (score >= 10) return "Your eczema is mild but still present. Continue your current management and pay attention to patterns — tracking your triggers and diet will help you identify what causes flare-ups over time.";
  return "Great news! Your PO-SCORAD score is very low, indicating minimal eczema activity. Keep up your current skincare routine and continue monitoring for any changes.";
};

// Get today's date as YYYY-MM-DD string (used as document key in Firestore)
export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
