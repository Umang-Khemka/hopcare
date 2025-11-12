"use client";

import { useState, useEffect } from "react";
import { Bell, Search, Heart, Star, Clock, MapPin, Sparkles, User, Mail, Phone, Lock } from "lucide-react";
import { useRouter,usePathname } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { mockUsers } from "@/src/data/mockUsers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage({ initialRole = "user" }: { initialRole?: "user" | "doctor" }) {
  const [step, setStep] = useState<"login" | "signup" | "otp">("login");
  const [form, setForm] = useState({ identifier: "", rememberMe: false });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    mobile: "",
    location: "",
    agreeTerms: false,
  });
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState<string>("");
  const [timer, setTimer] = useState(55);
  const [activeInput, setActiveInput] = useState(0);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"user" | "doctor">(
  (typeof window !== "undefined" && (localStorage.getItem("selectedRole") as "user" | "doctor")) || "user"
);
  const router = useRouter();
  const {login} = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (role === "doctor" && !pathname.includes("/auth/doctor/login")) {
      router.push("/auth/doctor/login");
    } else if (role === "user" && !pathname.includes("/auth/user/login")) {
      router.push("/auth/user/login");
    }
  }, [role, router, pathname]);

  useEffect(() => {
  localStorage.setItem("selectedRole", role);
}, [role]);


  // -------------------- HANDLERS --------------------
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (
      !signupForm.name.trim() ||
      !signupForm.email.trim() ||
      !signupForm.mobile.trim() ||
      !signupForm.location.trim()
    ) {
      setError("Please fill all fields");
      setLoading(false);
      return;
    }

    if (!signupForm.agreeTerms) {
      setError("Please agree to terms and conditions");
      setLoading(false);
      return;
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otpCode);

    toast.success(`OTP sent successfully!\n\nFor demo purposes, your OTP is: ${otpCode}`);

    setStep("otp");
    setTimer(55);
    setOtp(["", "", "", ""]);
    setActiveInput(0);
    setLoading(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  if (!form.identifier.trim()) {
    setError("Please enter email or mobile number");
    setLoading(false);
    return;
  }

  try {
    let userExists: any = null;

    if (role === "doctor") {
      // 🔹 Fetch doctor data from API
      const res = await fetch("/api/doctors");
      if (!res.ok) throw new Error("Failed to fetch doctors data");
      const doctors = await res.json();

      userExists = doctors.find(
        (doc: any) =>
          doc.email === form.identifier.trim() ||
          doc.mobile === form.identifier.trim()
      );
    } else {
      // 🔹 Use mock data for users
      userExists = mockUsers.find(
        (usr: any) =>
          usr.email === form.identifier.trim() ||
          usr.mobile === form.identifier.trim()
      );
    }

    if (!userExists) {
      setError("User not found. Please sign up first.");
      setLoading(false);
      return;
    }

    localStorage.setItem("tempUser", JSON.stringify(userExists));
    localStorage.setItem("selectedRole", role);

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otpCode);

    toast.success(`OTP sent successfully!\n\nFor demo purposes, your OTP is: ${otpCode}`);

    setStep("otp");
    setTimer(55);
    setOtp(["", "", "", ""]);
    setActiveInput(0);
    setLoading(false);
  } catch (err) {
    console.error(err);
    setError("Something went wrong. Please try again.");
    setLoading(false);
  }
};


  const handleOtpSubmit = () => {
    const enteredOtp = otp.join("");
    setError("");
    setLoading(true);

    if (enteredOtp.length !== 4) {
      setError("Please enter complete OTP");
      setLoading(false);
      return;
    }

    if (enteredOtp === generatedOtp) {
       const storedUser = JSON.parse(localStorage.getItem("tempUser") || "{}");
      const selectedRole = localStorage.getItem("selectedRole");

      toast.success("Login successful!");
      login(storedUser, form.rememberMe);
      localStorage.removeItem("tempUser");
      localStorage.removeItem("selectedRole");
      setLoading(false);
       if (selectedRole === "doctor" && storedUser?.id) {
        router.push(`/doctor/${storedUser.id}`);
      } else {
        router.push("/user/find-doctors");
      }
    } else {
      setError("Invalid OTP. Please try again.");
      setOtp(["", "", "", ""]);
      setActiveInput(0);
      setLoading(false);
    }
  };

  const handleNumberClick = (num: string) => {
    if (activeInput < 4) {
      const newOtp = [...otp];
      newOtp[activeInput] = num;
      setOtp(newOtp);
      if (activeInput < 3) {
        setActiveInput(activeInput + 1);
      }
    }
  };

  const handleBackspace = () => {
    if (activeInput > 0 || otp[activeInput]) {
      const newOtp = [...otp];
      if (otp[activeInput]) {
        newOtp[activeInput] = "";
      } else {
        setActiveInput(activeInput - 1);
        newOtp[activeInput - 1] = "";
      }
      setOtp(newOtp);
      setError("");
    }
  };

  const handleResendOTP = () => {
    if (timer > 0) return;

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otpCode);

    toast.success(`New OTP sent!\n\nFor demo: ${otpCode}`);

    setTimer(55);
    setOtp(["", "", "", ""]);
    setActiveInput(0);
    setError("");
  };

  useEffect(() => {
    if (step === "otp" && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const maskIdentifier = (identifier: string) => {
    if (identifier.includes("@")) {
      const [name, domain] = identifier.split("@");
      return `${name.slice(0, 2)}${"*".repeat(Math.max(0, name.length - 2))}@${domain}`;
    } else {
      return `+91 ${identifier.slice(0, 3)} ${"*".repeat(Math.max(0, identifier.length - 5))}${identifier.slice(-2)}`;
    }
  };

  const handleGoogleSignIn = () => {
    toast.success("Google Sign-In demo");
  };

  // -------------------- UI --------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Toast Container with CENTER position */}
      <ToastContainer 
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[40%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] right-[20%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {step === "login" ? (
        <div className="relative flex w-full max-w-5xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          {/* Left Side */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 p-12 items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="text-center relative z-10">
              <div className="mb-8">
                <Sparkles className="w-20 h-20 mx-auto text-white mb-4 animate-pulse" />
              </div>
              <h2 className="text-white text-4xl font-bold mb-4 drop-shadow-lg">
                Welcome Back!
              </h2>
              <p className="text-white/90 text-lg mb-6">
                Book Your Appointment Now!
              </p>
              <div className="flex items-center justify-center gap-4 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-white" />
                  <span>4.9 Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="w-full lg:w-1/2 p-12">
            <div className="max-w-md mx-auto">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Login
              </h2>
              <p className="text-gray-600 mb-8">Enter your credentials to continue</p>

              {/* Role toggle */}
              <div className="flex items-center gap-3 mb-6 bg-gray-100/80 backdrop-blur-sm rounded-2xl p-1.5">
                <button
                  onClick={() => setRole("user")}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    role === "user"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg scale-105"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  User
                </button>
                <button
                  onClick={() => setRole("doctor")}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    role === "doctor"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg scale-105"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Heart className="w-4 h-4 inline mr-2" />
                  Doctor
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mobile Number / Email ID
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter mobile or email"
                      className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-gray-700 transition-all bg-white/50 backdrop-blur-sm"
                      value={form.identifier}
                      onChange={(e) => {
                        setForm({ ...form, identifier: e.target.value });
                        setError("");
                      }}
                      disabled={loading}
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="text-lg">⚠️</span> {error}
                  </p>}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="mr-2 w-4 h-4 text-cyan-500 border-gray-300 rounded focus:ring-cyan-400"
                    checked={form.rememberMe}
                    onChange={(e) =>
                      setForm({ ...form, rememberMe: e.target.checked })
                    }
                  />
                  <label htmlFor="remember" className="text-gray-700 text-sm">
                    Remember me for 30 days
                  </label>
                </div>

                <button
                  onClick={handleLoginSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3.5 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? "Sending OTP..." : "Login"}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full border-2 border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-all font-medium flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <p className="text-center text-sm text-gray-600 mt-6">
                  Don't have an account?{" "}
                  <button
                    className="text-transparent bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text font-bold hover:from-cyan-700 hover:to-purple-700"
                    onClick={() => setStep("signup")}
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : step === "signup" ? (
        <div className="relative flex w-full max-w-5xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          {/* Left Side */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 p-12 items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="text-center relative z-10">
              <div className="mb-8">
                <Heart className="w-20 h-20 mx-auto text-white mb-4 animate-pulse" />
              </div>
              <h2 className="text-white text-4xl font-bold mb-4 drop-shadow-lg">
                Join Us Today!
              </h2>
              <p className="text-white/90 text-lg">Create your account to get started</p>
            </div>
          </div>

          {/* Right Side */}
          <div className="w-full lg:w-1/2 p-12 overflow-y-auto max-h-screen">
            <div className="max-w-md mx-auto">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                Sign Up
              </h2>
              <p className="text-gray-600 mb-8">Create a new account</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-gray-700 transition-all bg-white/50 backdrop-blur-sm"
                      value={signupForm.name}
                      onChange={(e) => {
                        setSignupForm({ ...signupForm, name: e.target.value });
                        setError("");
                      }}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email ID
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-gray-700 transition-all bg-white/50 backdrop-blur-sm"
                      value={signupForm.email}
                      onChange={(e) => {
                        setSignupForm({ ...signupForm, email: e.target.value });
                        setError("");
                      }}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="Enter your mobile number"
                      className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-gray-700 transition-all bg-white/50 backdrop-blur-sm"
                      value={signupForm.mobile}
                      onChange={(e) => {
                        setSignupForm({ ...signupForm, mobile: e.target.value });
                        setError("");
                      }}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter your location"
                      className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-gray-700 transition-all bg-white/50 backdrop-blur-sm"
                      value={signupForm.location}
                      onChange={(e) => {
                        setSignupForm({ ...signupForm, location: e.target.value });
                        setError("");
                      }}
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <span className="text-lg">⚠️</span> {error}
                  </p>
                )}

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mr-2 w-4 h-4 text-purple-500 border-gray-300 rounded focus:ring-purple-400 mt-1"
                    checked={signupForm.agreeTerms}
                    onChange={(e) => setSignupForm({ ...signupForm, agreeTerms: e.target.checked })}
                  />
                  <label htmlFor="terms" className="text-gray-700 text-sm">
                    I agree to the{" "}
                    <button className="text-transparent bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text font-semibold">
                      Terms and Conditions
                    </button>
                  </label>
                </div>

                <button
                  onClick={handleSignupSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white py-3.5 rounded-xl hover:from-purple-600 hover:to-cyan-600 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? "Creating Account..." : "Sign Up"}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or sign up with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full border-2 border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-all font-medium flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <p className="text-center text-sm text-gray-600 mt-6">
                  Already have an account?{" "}
                  <button 
                    className="text-transparent bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text font-bold hover:from-purple-700 hover:to-cyan-700"
                    onClick={() => setStep("login")}
                  >
                    Login
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 w-full max-w-md border border-white/50">
          <button
            onClick={() => {
              setStep("login");
              setError("");
              setOtp(["", "", "", ""]);
            }}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
              OTP Verification
            </h2>
            <p className="text-gray-600 text-sm">
              Code sent to {maskIdentifier(form.identifier)}
            </p>
          </div>

          <div className="flex justify-center gap-3 mb-4">
            {otp.map((digit, index) => (
              <div
                key={index}
                className={`w-14 h-14 border-2 rounded-xl flex items-center justify-center text-2xl font-bold transition-all ${
                  index === activeInput && !digit
                    ? "border-cyan-400 bg-cyan-50 ring-4 ring-cyan-100"
                    : digit
                    ? "border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50 text-cyan-600 shadow-md"
                    : "border-gray-200 bg-white"
                }`}
              >
                {digit || ""}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4 flex items-center justify-center gap-1">
              <span className="text-lg">⚠️</span> {error}
            </p>
          )}

          <p className="text-center text-sm text-gray-600 mb-6">
            {timer > 0 ? (
              <>
                Resend code in{" "}
                <span className="text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text font-bold">
                  {timer}s
                </span>
              </>
            ) : (
              <button
                onClick={handleResendOTP}
                className="text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text font-bold hover:from-cyan-700 hover:to-blue-700"
              >
                Resend OTP
              </button>
            )}
          </p>

          <button
            onClick={handleOtpSubmit}
            disabled={!otp.every(digit => digit !== "") || loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3.5 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all font-semibold shadow-lg hover:shadow-xl mb-6 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                disabled={loading}
                className="h-14 text-xl font-bold text-gray-700 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 rounded-xl transition-all disabled:opacity-50 border border-gray-200 hover:border-cyan-300 hover:shadow-md active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleNumberClick("*")}
              disabled={loading}
              className="h-14 text-xl font-bold text-gray-700 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 rounded-xl transition-all disabled:opacity-50 border border-gray-200 hover:border-cyan-300 hover:shadow-md active:scale-95"
            >
              *
            </button>
            <button
              onClick={() => handleNumberClick("0")}
              disabled={loading}
              className="h-14 text-xl font-bold text-gray-700 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 rounded-xl transition-all disabled:opacity-50 border border-gray-200 hover:border-cyan-300 hover:shadow-md active:scale-95"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              disabled={loading}
              className="h-14 flex items-center justify-center hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50 rounded-xl transition-all disabled:opacity-50 border border-gray-200 hover:border-red-300 hover:shadow-md active:scale-95"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}