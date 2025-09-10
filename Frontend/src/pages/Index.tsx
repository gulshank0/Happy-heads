import Feedbacks from "@/components/Feeadback/Feedbacks";
import About from "@/components/Feedbacks/About";
import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Header/Navbar";
import Pricing from "@/components/Pricing/Pricing";
import { Shield, Heart, Star, TriangleAlert, Users, Sparkles } from "lucide-react";



export default function Index() {
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/auth/google";
  };
  return (
    <>
    <Navbar />
    <section className="min-h-screen bg-black text-white flex items-center relative pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto relative text-center w-full z-10">
        {/* Decorative Emojis */}
        <div className="absolute -left-10 -top-100 text-4xl sm:text-6xl opacity-20 transform skew-y-12">
          💕
        </div>
        <div className="absolute -right-10 -top-5 text-2xl sm:text-4xl opacity-20 transform -skew-y-12">
          ✨
        </div>

        {/* Badge */}
        <div className="mb-6 text-center">
          <span className="inline-block bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-full px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium text-pink-300 mb-6">
            🎓 The #1 College Dating Platform in India
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="font-poppins text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-center">
          <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
            Where Matches Are Meant
          </span>
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
            to Meet
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl md:text-2xl leading-6 sm:leading-8 mb-12 text-white/70 max-w-4xl mx-auto px-4">
          Connect with genuine college students, build meaningful relationships, and discover your perfect study partner or soulmate.
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent font-semibold">
            Where campus romance meets real connections.
          </span>
        </p>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-12 max-w-4xl mx-auto">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 hover:scale-105 transition-transform duration-400" >
            <div className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent text-3xl font-bold leading-9 mb-1">
              1,600+
            </div>
            <div className="text-white/60 text-sm">
              Happy Students
            </div>
          </div>
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 hover:scale-105 transition-transform duration-400">
            <div className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent text-3xl font-bold leading-9 mb-1">
              32+
            </div>
            <div className="text-white/60 text-sm">
              Colleges Connected
            </div>
          </div>
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 hover:scale-105 transition-transform duration-400" >
            <div className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent text-3xl font-bold leading-9 mb-1">
              643+
            </div>
            <div className="text-white/60 text-sm">
              Successful Matches
            </div>
          </div>
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 hover:scale-105 transition-transform duration-400">
            <div className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent text-3xl font-bold leading-9 mb-1">
              4.1/5
            </div>
            <div className="text-white/60 text-sm">
              Average Rating
            </div>
          </div>
        </div>

{/* Decorative Emojis */}
        <div className="absolute -left-10 -top-200 text-4xl sm:text-6xl opacity-100 transform skew-y-12">
          💕
        </div>
        <div className="absolute -right-10 -top-200 text-2xl sm:text-4xl opacity-100 transform -skew-y-12">
          ✨
        </div>

        {/* Registration Notice */}
        <div className="flex flex-col items-center gap-6 px-4">
          <div className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-2 max-w-md mx-auto w-full">
            <div className="flex items-center text-orange-300 text-sm">
              <TriangleAlert className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="font-medium ml-2">Registration Update</span>
            </div>
            <p className="text-orange-200 text-sm mt-1">
              Boys registration will open soon! Girls can join now.
            </p>
          </div>

          {/* Google Login Button */}
          <div className="max-w-sm w-full">
            <button className="w-full inline-flex items-center justify-center h-12 sm:h-14 px-6 sm:px-8 backdrop-blur-md bg-white/12 border border-white/20 rounded-lg text-base sm:text-lg font-medium text-white hover:bg-white/16 transition-all duration-300" onClick={handleGoogleLogin}>
              <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Login with Google
            </button>
          </div>

          {/* Or Join As */}
          <div className="text-white/50 text-sm font-medium px-4">
            or join as
          </div>

          {/* Join Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-md w-full">
            <div className="flex-1 hover:scale-105 transition-transform duration-400">
              <button className="w-full inline-flex items-center justify-center h-12 sm:h-14 px-6 sm:px-8 bg-gradient-to-r from-pink-500 to-red-500 to-pink-600 rounded-lg text-base sm:text-lg font-medium text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-300 min-h-12" onClick={()=>window.location.href='/profile'}>
                <Heart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                College Girl
              </button>
            </div>
            <div className="flex-1 hover:scale-105 transition-transform duration-400">
              <button
                disabled
                className="w-full inline-flex items-center justify-center h-12 sm:h-14 px-6 sm:px-8 backdrop-blur-md bg-slate-600 border border-white/20 rounded-lg text-base sm:text-lg font-medium text-white opacity-50 cursor-not-allowed pointer-events-none min-h-12"
              >
                <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-center text-sm sm:text-base">
                  Boys Entry Closed
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-12 text-white/40 text-xs sm:text-sm px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>100% Verified Profiles</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span>643+ Matches Made</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span>4.9/5 Rating</span>
          </div>
        </div>
      </div>

    </section>
    <Feedbacks />
    <About />
    <Pricing/>

    <Footer />
    </>
  );
}
