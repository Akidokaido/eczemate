// src/firebase/seed.js
// Browser-runnable seed script to populate Firestore with test data
import {
  auth,
  firestore,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  doc,
  setDoc,
  collection,
  addDoc,
  Timestamp
} from "./config";
import { getUserDocRef } from "./userPaths";

const TEST_USERS = [
  {
    email: "ahmad@eczemate.com",
    password: "Ahmad123!",
    role: "patient",
    name: "Ahmad Bin Ali",
    doctorId: "" // will be set after doctor is created
  },
  {
    email: "siti@eczemate.com",
    password: "Siti1234!",
    role: "patient",
    name: "Siti Nurhaliza",
    doctorId: ""
  },
  {
    email: "dr.lee@eczemate.com",
    password: "Doctor123!",
    role: "doctor",
    name: "Dr. Lee Wei Ming"
  },
  {
    email: "admin@eczemate.com",
    password: "Admin123!",
    role: "admin",
    name: "Admin User"
  }
];

export async function seedDatabase(setStatus) {
  const log = (msg) => {
    console.log(msg);
    if (setStatus) setStatus((prev) => prev + "\n" + msg);
  };

  try {
    const createdUsers = {};

    // 1. Create all users
    for (const user of TEST_USERS) {
      try {
        log(`Creating user: ${user.email}...`);
        const cred = await createUserWithEmailAndPassword(auth, user.email, user.password);
        createdUsers[user.role === "doctor" ? "doctor" : user.email] = cred.user.uid;

        // Write to role-based subcollection: users/{role}/accounts/{uid}
        await setDoc(getUserDocRef(user.role, cred.user.uid), {
          email: user.email,
          role: user.role,
          name: user.name,
          ...(user.role === "doctor" ? { status: "approved" } : {}),
          createdAt: Timestamp.now()
        });

        log(`✅ Created ${user.role}: ${user.email} (UID: ${cred.user.uid})`);
      } catch (err) {
        if (err.code === "auth/email-already-in-use") {
          log(`⚠️ ${user.email} already exists, signing in to get UID...`);
          try {
            const cred = await signInWithEmailAndPassword(auth, user.email, user.password);
            createdUsers[user.role === "doctor" ? "doctor" : user.email] = cred.user.uid;

            // Ensure Firestore profile exists in role-based subcollection
            await setDoc(getUserDocRef(user.role, cred.user.uid), {
              email: user.email,
              role: user.role,
              name: user.name,
              ...(user.role === "doctor" ? { status: "approved" } : {}),
              createdAt: Timestamp.now()
            }, { merge: true });

            log(`✅ Signed in ${user.role}: ${user.email} (UID: ${cred.user.uid})`);
          } catch (signInErr) {
            log(`❌ Could not sign in ${user.email}: ${signInErr.message}`);
          }
        } else {
          log(`❌ Error creating ${user.email}: ${err.message}`);
        }
      }
    }

    const doctorId = createdUsers["doctor"];
    const ahmadId = createdUsers["ahmad@eczemate.com"];
    const sitiId = createdUsers["siti@eczemate.com"];

    if (!doctorId) {
      log("❌ Doctor was not created — cannot seed related data. Try logging in as doctor first to get UID.");
      return;
    }

    // 2. Create doctor profile (separate doctors collection for specialty data)
    log("Creating doctor profile...");
    await setDoc(doc(firestore, "doctors", doctorId), {
      name: "Dr. Lee Wei Ming",
      email: "dr.lee@eczemate.com",
      specialty: "Dermatology",
      clinicInfo: {
        name: "EczeMate Skin Clinic",
        address: "123 Medical Street, KL"
      },
      availability: ["Monday", "Wednesday", "Friday"],
      createdAt: Timestamp.now()
    });
    log("✅ Doctor profile created");

    // 3. Update patient doctorId references (in role-based subcollection)
    if (ahmadId) {
      await setDoc(getUserDocRef("patient", ahmadId), { doctorId }, { merge: true });
    }
    if (sitiId) {
      await setDoc(getUserDocRef("patient", sitiId), { doctorId }, { merge: true });
    }

    // 4. Create appointments
    log("Creating appointments...");
    const appointments = [
      {
        patientId: ahmadId || "ahmad_placeholder",
        patientName: "Ahmad Bin Ali",
        patientEmail: "ahmad@eczemate.com",
        doctorId,
        doctorName: "Dr. Lee Wei Ming",
        date: Timestamp.fromDate(new Date("2026-03-18T10:00:00")),
        status: "pending",
        reason: "Eczema flare-up on arms",
        createdAt: Timestamp.now()
      },
      {
        patientId: sitiId || "siti_placeholder",
        patientName: "Siti Nurhaliza",
        patientEmail: "siti@eczemate.com",
        doctorId,
        doctorName: "Dr. Lee Wei Ming",
        date: Timestamp.fromDate(new Date("2026-03-20T14:00:00")),
        status: "approved",
        reason: "Follow-up consultation",
        createdAt: Timestamp.now()
      },
      {
        patientId: ahmadId || "ahmad_placeholder",
        patientName: "Ahmad Bin Ali",
        patientEmail: "ahmad@eczemate.com",
        doctorId,
        doctorName: "Dr. Lee Wei Ming",
        date: Timestamp.fromDate(new Date("2026-03-10T09:00:00")),
        status: "approved",
        reason: "Initial consultation",
        createdAt: Timestamp.now()
      }
    ];

    for (const appt of appointments) {
      await addDoc(collection(firestore, "appointments"), appt);
    }
    log(`✅ Created ${appointments.length} appointments`);

    // 5. Create symptom logs
    log("Creating symptom logs...");
    const symptomLogs = [
      {
        userId: ahmadId || "ahmad_placeholder",
        date: Timestamp.fromDate(new Date("2026-03-01")),
        frontAreas: ["Chest", "Forearms"],
        backAreas: ["Upper Back"],
        severity: { dryness: 7, redness: 6, swelling: 3, scratchMarks: 5, thickeningSkin: 4 },
        createdAt: Timestamp.now()
      },
      {
        userId: ahmadId || "ahmad_placeholder",
        date: Timestamp.fromDate(new Date("2026-03-05")),
        frontAreas: ["Forearms"],
        backAreas: [],
        severity: { dryness: 5, redness: 4, swelling: 2, scratchMarks: 3, thickeningSkin: 3 },
        createdAt: Timestamp.now()
      },
      {
        userId: ahmadId || "ahmad_placeholder",
        date: Timestamp.fromDate(new Date("2026-03-12")),
        frontAreas: ["Hands"],
        backAreas: [],
        severity: { dryness: 3, redness: 2, swelling: 1, scratchMarks: 2, thickeningSkin: 2 },
        createdAt: Timestamp.now()
      },
      {
        userId: sitiId || "siti_placeholder",
        date: Timestamp.fromDate(new Date("2026-03-02")),
        frontAreas: ["Neck", "Chest"],
        backAreas: ["Lower Back"],
        severity: { dryness: 8, redness: 7, swelling: 5, scratchMarks: 6, thickeningSkin: 4 },
        createdAt: Timestamp.now()
      },
      {
        userId: sitiId || "siti_placeholder",
        date: Timestamp.fromDate(new Date("2026-03-08")),
        frontAreas: ["Neck"],
        backAreas: [],
        severity: { dryness: 6, redness: 5, swelling: 3, scratchMarks: 4, thickeningSkin: 3 },
        createdAt: Timestamp.now()
      }
    ];

    for (const log_ of symptomLogs) {
      await addDoc(collection(firestore, "symptom_logs"), log_);
    }
    log(`✅ Created ${symptomLogs.length} symptom logs`);

    // 6. Create journal entries
    log("Creating journal entries...");
    const journals = [
      {
        userId: ahmadId || "ahmad_placeholder",
        date: Timestamp.fromDate(new Date("2026-03-01")),
        entry: "Noticed a flare-up on my forearms today. The skin is dry and red. Applied moisturizer twice. Avoided scratching as much as possible.",
        createdAt: Timestamp.now()
      },
      {
        userId: ahmadId || "ahmad_placeholder",
        date: Timestamp.fromDate(new Date("2026-03-05")),
        entry: "Skin improving on my forearms. Redness reduced significantly. Continued using prescribed cream. Drank more water today.",
        createdAt: Timestamp.now()
      },
      {
        userId: ahmadId || "ahmad_placeholder",
        date: Timestamp.fromDate(new Date("2026-03-12")),
        entry: "Hands are slightly dry but much better than last week. Only minor itching. The new moisturizer seems to be working well.",
        createdAt: Timestamp.now()
      },
      {
        userId: sitiId || "siti_placeholder",
        date: Timestamp.fromDate(new Date("2026-03-02")),
        entry: "Severe dryness on neck and chest area. Very uncomfortable. Tried oatmeal bath which helped a bit. Need to see doctor soon.",
        createdAt: Timestamp.now()
      },
      {
        userId: sitiId || "siti_placeholder",
        date: Timestamp.fromDate(new Date("2026-03-08")),
        entry: "Neck is getting better after following new treatment plan. Reduced stress this week which seems to help. Sleeping better too.",
        createdAt: Timestamp.now()
      }
    ];

    for (const j of journals) {
      await addDoc(collection(firestore, "journals"), j);
    }
    log(`✅ Created ${journals.length} journal entries`);

    log("\n🎉 Database seeded successfully!");
  } catch (error) {
    log(`❌ Seed error: ${error.message}`);
    console.error(error);
  }
}

export async function seedJamal(setStatus) {
  const log = (msg) => {
    console.log(msg);
    if (setStatus) setStatus((prev) => prev + "\n" + msg);
  };

  try {
    log("Signing in as jamal123@gmail.com...");
    const cred = await signInWithEmailAndPassword(auth, "jamal123@gmail.com", "Password123");
    const uid = cred.user.uid;
    log(`Signed in successfully! UID: ${uid}`);

    log("Generating 60 days of SCORAD scores and Journal entries...");
    for (let i = 60; i >= 0; i--) {
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() - i);
      const firebaseTimestamp = Timestamp.fromDate(dateObj);
      
      const baseScore = 65 - ((60 - i) * 0.6);
      const score = Math.max(0, Math.min(103, Math.round(baseScore + (Math.random() * 10 - 5))));
      
      await addDoc(collection(firestore, "users", "patients", "accounts", uid, "trackProgress"), {
        scoradScore: score,
        symptoms: {
          redness: Math.floor(score / 3),
          swelling: Math.floor(score / 4),
          oozing: Math.floor(score / 5),
          scratching: Math.floor(score / 3),
          sleepLoss: Math.floor(score / 4),
          dryness: Math.floor(score / 3)
        },
        timestamp: firebaseTimestamp
      });

      const emotions = ["Happy", "Anxious", "Stressed", "Calm", "Frustrated"];
      const triggers = ["Stress", "Heat", "Dust", "Dairy", "None"];
      
      await addDoc(collection(firestore, "users", "patients", "accounts", uid, "journal"), {
        date: firebaseTimestamp,
        createdAt: firebaseTimestamp,
        fullDate: dateObj.toISOString(),
        score,
        emotion: emotions[Math.floor(Math.random() * emotions.length)],
        sleepHours: Math.floor(Math.random() * 4) + 5,
        sleepQuality: Math.random() > 0.5 ? "Good" : "Poor",
        entry: score > 50 ? "Having a tough time with flare-ups today. The skin is very itchy." : "Skin feels relatively calm today. Keeping up with the moisturizing routine.",
        foodLog: [triggers[Math.floor(Math.random() * triggers.length)]].join(', ')
      });
    }

    log("✅ Successfully seeded 60 days of data for Jamal!");
  } catch (error) {
    log(`❌ Error: ${error.message}`);
  }
}
