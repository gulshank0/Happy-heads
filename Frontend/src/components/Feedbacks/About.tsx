import { Heart, Brain, Shield, Users, MessageCircle } from "lucide-react";

export default function About() {
  return (
    <section className="min-h-screen bg-black text-white py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-poppins text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              Why College Students Love Cufy
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Designed specifically for college life, relationships, and meaningful connections that last beyond graduation.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Smart Matching */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8 hover:scale-105 transition-transform duration-400">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-violet-500/20 to-pink-500/20 rounded-lg border border-violet-500/30">
                <Brain className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold">Smart Matching</h3>
            </div>
            <p className="text-white/70 leading-relaxed">
              Our AI algorithm finds your perfect college match based on interests, goals, and compatibility.
            </p>
          </div>

          {/* Safe & Secure */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8 hover:scale-105 transition-transform duration-400">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold">Safe & Secure</h3>
            </div>
            <p className="text-white/70 leading-relaxed">
              Verified college profiles with secure messaging. Your privacy and safety are our top priority.
            </p>
          </div>

          {/* Meaningful Connections */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8 hover:scale-105 transition-transform duration-400">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-pink-500/20 to-red-500/20 rounded-lg border border-pink-500/30">
                <Users className="h-6 w-6 text-pink-400" />
              </div>
              <h3 className="text-2xl font-bold">Meaningful Connections</h3>
            </div>
            <p className="text-white/70 leading-relaxed">
              Skip the superficial. Connect with people who share your academic interests and life goals.
            </p>
          </div>

          {/* Real-time Chat */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8 hover:scale-105 transition-transform duration-400">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                <MessageCircle className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold">Real-time Chat</h3>
            </div>
            <p className="text-white/70 leading-relaxed">
              Instant messaging with your matches. Share your thoughts, plans, and build genuine relationships.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}