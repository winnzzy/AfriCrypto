
import React from 'react';
import { Lightbulb, ShieldCheck, Zap, Info } from 'lucide-react'; // Example icons

interface InfoCardProps {
  title: string;
  text: string;
  iconName?: string; // Icon name from Lucide
  onClick?: () => void;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, text, iconName, onClick }) => {
  const IconComponent = 
    iconName === "Lightbulb" ? Lightbulb :
    iconName === "ShieldCheck" ? ShieldCheck :
    iconName === "Zap" ? Zap :
    Info; // Default icon

  return (
    <div 
      className="my-6 bg-gradient-to-r from-blue-500/80 to-purple-600/80 border border-blue-400/30 rounded-xl p-4 flex items-start space-x-3 shadow-lg hover:shadow-xl transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-white/20 p-2 rounded-full mt-1">
        <IconComponent className="w-5 h-5 text-white" />
      </div>
      <div>
        <h4 className="text-white font-semibold text-md mb-0.5">{title}</h4>
        <p className="text-blue-100 text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
};

export default InfoCard;
