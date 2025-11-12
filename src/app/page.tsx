"use client";
import React from "react";
import {
  Calendar,
  HeartPulse,
  Stethoscope,
  Star,
  Shield,
  Clock,
  ChevronRight,
  CheckCircle,
  Users,
  Award,
} from "lucide-react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-800 min-h-screen">
      <Navbar/>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-24 md:pt-40 md:pb-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-cyan-100">
                <Shield className="text-cyan-600" size={16} />
                <span className="text-sm font-medium text-gray-700">Trusted by 50,000+ Patients</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Your Health,
                </span>
                <br />
                <span className="text-gray-900">Our Priority</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                Book appointments with verified doctors in seconds. Get quality healthcare without the wait.
              </p>

              <div className="flex flex-wrap gap-4">
                <button className="group bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-2">
                  Book Appointment Now
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </button>
                <button className="bg-white text-gray-700 px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all border border-gray-200 hover:border-cyan-300 hover:-translate-y-1">
                  Find Doctors
                </button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                    <Users className="text-cyan-600" size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">500+</p>
                    <p className="text-sm text-gray-600">Expert Doctors</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Award className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">98%</p>
                    <p className="text-sm text-gray-600">Satisfaction Rate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Image/Illustration */}
            <div className="relative">
              <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&h=600&fit=crop"
                  alt="Healthcare Professional"
                  className="rounded-2xl w-full h-auto object-cover"
                />
                
                {/* Floating Card */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="text-white" size={28} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Next Available</p>
                      <p className="font-bold text-gray-900">Today, 2:30 PM</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl opacity-20 blur-xl"></div>
              <div className="absolute -bottom-8 right-12 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl opacity-20 blur-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Why Choose Us
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience healthcare that's convenient, reliable, and focused on you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Stethoscope,
              title: "Expert Doctors",
              text: "Access to verified specialists across 50+ medical fields with proven track records",
              gradient: "from-cyan-500 to-blue-500",
              bgGradient: "from-cyan-50 to-blue-50",
            },
            {
              icon: Clock,
              title: "Instant Booking",
              text: "Book appointments 24/7 with real-time availability and instant confirmation",
              gradient: "from-blue-500 to-indigo-500",
              bgGradient: "from-blue-50 to-indigo-50",
            },
            {
              icon: HeartPulse,
              title: "Quality Care",
              text: "Comprehensive healthcare services with patient-first approach and follow-up support",
              gradient: "from-indigo-500 to-purple-500",
              bgGradient: "from-indigo-50 to-purple-50",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-cyan-200 hover:-translate-y-2"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <div className="relative z-10">
                <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Departments Section */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Our Departments
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Specialized care across multiple medical disciplines
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Cardiology", img: "https://cdn-icons-png.flaticon.com/512/2966/2966481.png", desc: "Heart & vascular care", color: "from-red-500 to-pink-500" },
              { name: "Neurology", img: "https://cdn-icons-png.flaticon.com/512/4320/4320342.png", desc: "Brain & nervous system", color: "from-purple-500 to-indigo-500" },
              { name: "Orthopedics", img: "https://cdn-icons-png.flaticon.com/512/4320/4320354.png", desc: "Bone & joint treatment", color: "from-blue-500 to-cyan-500" },
              { name: "Gynecology", img: "https://cdn-icons-png.flaticon.com/512/3048/3048398.png", desc: "Women's health care", color: "from-pink-500 to-rose-500" },
              { name: "Pediatrics", img: "https://cdn-icons-png.flaticon.com/512/3750/3750042.png", desc: "Child health services", color: "from-cyan-500 to-blue-500" },
              { name: "Dermatology", img: "https://cdn-icons-png.flaticon.com/512/4320/4320347.png", desc: "Skin care specialist", color: "from-amber-500 to-orange-500" },
              { name: "Urology", img: "https://cdn-icons-png.flaticon.com/512/2833/2833147.png", desc: "Urinary system care", color: "from-teal-500 to-emerald-500" },
              { name: "ENT", img: "https://cdn-icons-png.flaticon.com/512/4320/4320397.png", desc: "Ear, nose & throat", color: "from-indigo-500 to-purple-500" },
            ].map((dept, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-cyan-200 hover:-translate-y-2 cursor-pointer"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${dept.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <img
                    src={dept.img}
                    alt={dept.name}
                    className="w-8 h-8 object-contain brightness-0 invert"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{dept.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{dept.desc}</p>
                <button className="text-cyan-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  View Doctors
                  <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Patient Stories
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real experiences from our valued patients
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: "Priya Sharma",
              role: "Software Engineer",
              text: "Booking was incredibly smooth! Found an excellent cardiologist and got an appointment the same day. The doctor was professional and thorough.",
            },
            {
              name: "Rajesh Kumar",
              role: "Business Owner",
              text: "Finally, a healthcare platform that actually works. No more waiting on calls or visiting hospitals just to book appointments. Highly recommended!",
            },
            {
              name: "Anita Patel",
              role: "Teacher",
              text: "The doctors here are top-notch. I've been using this platform for my family's healthcare needs and couldn't be happier with the quality of care.",
            },
          ].map((testimonial, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-cyan-200"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    size={18}
                    className="fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-6 italic">
                "{testimonial.text}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-3xl p-12 md:p-16 text-center shadow-2xl relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Take Control of Your Health?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of satisfied patients who trust us with their healthcare needs
              </p>
              <button className="bg-white text-cyan-600 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all inline-flex items-center gap-2">
                Book Your Appointment Now
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
}