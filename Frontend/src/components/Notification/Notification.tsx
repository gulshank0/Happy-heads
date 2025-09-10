import React from 'react';
import { Bell, Heart, Users } from 'lucide-react';


export default function Notification() {
    return (
        <div className="p-4">
            
            <div className="space-y-8">
              <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
                <Bell className="w-8 h-8 mr-3 text-pink-400" />
                <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                  Notifications
                </span>
              </h1>
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Bell className="w-6 h-6 mr-2 text-pink-400" />
                  Recent Activity
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-r from-violet-400 to-pink-400 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">Someone liked your profile</p>
                      <p className="text-sm text-white/60">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-red-400 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">New match available</p>
                      <p className="text-sm text-white/60">5 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            )          
        </div>
    );
}