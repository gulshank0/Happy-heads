import { Check } from "lucide-react";

export default function Pricing() {
  return (
    <section className="min-h-screen bg-black text-white py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 ">
          <h2 className="font-poppins text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              Premium Plans for College Boys
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Choose the perfect plan to unlock meaningful connections and find your college soulmate.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Starter Plan */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8 relative hover:scale-105 transition-transform duration-400">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <div className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                  ₹99
                </span>
              </div>
              <p className="text-white/60">1 match card × 2 rounds</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>2 total matches</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Basic profile</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Chat support</span>
              </div>
            </div>

            <button className="w-full inline-flex items-center justify-center h-12 px-6 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg text-lg font-medium text-white hover:bg-white/15 transition-all duration-300">
              Get Started
            </button>
          </div>

          {/* Premium Plan */}
          <div className="backdrop-blur-md bg-gradient-to-b from-pink-500/20 to-purple-500/20 border-2 border-pink-500/30 rounded-xl p-8 relative hover:scale-105 transition-transform duration-400">
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                ⭐ MOST POPULAR
              </span>
            </div>

            <div className="text-center mb-6 mt-4">
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <div className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                  ₹249
                </span>
              </div>
              <p className="text-white/60">1st round = 2 options, 2nd round = 3 options</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>5 total matches</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Premium profile</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Priority support</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Advanced filters</span>
              </div>
            </div>

            <button className="w-full inline-flex items-center justify-center h-12 px-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-lg font-medium text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-300">
              🚀 Get Premium
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}