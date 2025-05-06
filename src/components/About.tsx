import React, { useState } from 'react';
import { Info, Map, Shield, Scale, MessageCircle, FileText } from 'lucide-react';
import { translations } from '../translations';

interface AboutProps {
  language?: 'en' | 'es' | 'zh' | 'hi' | 'ar';
}

const About = ({ language = 'en' }: AboutProps) => {
  const [activeCard, setActiveCard] = useState<number>(0);
  const t = translations[language];

  const sections = [
    {
      title: 'About This App',
      icon: Info,
      content: [
        'VÍGIA is a community-driven application designed to help protect immigrant rights and provide tools for safe interactions with authorities. The app is intended to educate users about their rights and responsibilities and does not encourage evasion of law enforcement. Compliance with lawful orders, such as warrants issued by a judge, is essential.',
        <span key="case-law" className="CaseLaw_Emphasis">(See NAACP v. Alabama, 1958; Richmond Newspapers, Inc. v. Virginia, 1980)</span>
      ]
    },
    {
      title: 'Map Module',
      icon: Map,
      content: [
        'Starting the app, you will be presented with a map of your area. You will see markers that will show community-reported sightings of ICE or law enforcement. These markers are intended solely to keep the community informed about visible law enforcement activity and do not encourage or facilitate evasion of authorities.',
        <span key="case-law" className="CaseLaw_Emphasis">(See Smith v. Cumming, 11th Cir. 2000; Fordyce v. City of Seattle, 9th Cir. 1995)</span>,
        'Click on the place a mark, then click on the map where you see them. This will bring up a box to confirm whether this was ICE or police. This will place a mark that other users will be able to see.',
        'Other users will be able to see these marks when they log into the site. If a user clicks on the mark, they can confirm if it is still there or has passed. This will allow you to be informed of what is happening in your area.'
      ]
    },
    {
      title: 'Encounter Mode',
      icon: MessageCircle,
      content: [
        'Imagine if ICE is at your door. There are things to consider:',
        <div key="considerations" className="space-y-2 ml-4">
          <div className="flex items-start">
            <span className="text-blue-400 mr-2">•</span>
            <span>If you don't know your rights, you may just open the door.</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-400 mr-2">•</span>
            <span>If you speak, and you have an accent, you may be profiled and followed further.</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-400 mr-2">•</span>
            <span>Your Fifth Amendment states you don't have to speak.</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-400 mr-2">•</span>
            <span>You don't understand English.</span>
          </div>
        </div>,
        'Place the app on the door and press the listen button. This will use an AI system to listen for English speech and translate to Spanish on screen so you can understand what is being said.',
        <span key="warning" className="text-yellow-400 font-medium">Important:</span>,
        'You still should not respond. Unfortunately, there are instances where individuals may face biased assumptions based on their accent or language. In the United States, this is referred to as Racial Profiling—making judgments about someone based on their appearance or the way they sound.',
        'Instead of talking, press one of the pre-made buttons on the screen. It will announce the following things for you.',
        'Artificial Intelligence is making these messages and rendering them in a neutral, Male Caucasian voice to reduce potential biases or assumptions based on the speaker\'s accent or background. This feature aims to promote impartial communication and avoid misinterpretation during interactions with authorities.',
        'At the bottom, there is a section where you can type your own message in Spanish. When you hit send, Artificial Intelligence will translate it to English text, pass it through another AI, and turn it into a Caucasian voice for those to hear.'
      ]
    },
    {
      title: 'Rights Panel',
      icon: Scale,
      content: [
        'Before proceeding, it\'s important to note: If law enforcement presents a valid, signed warrant, it is your legal obligation to comply. A warrant is typically issued by a judge based on evidence related to a criminal investigation. Failure to comply with a lawful warrant can result in additional legal consequences. The purpose of this app is to inform and educate users about their rights—not to encourage evasion of law enforcement or obstruct justice.',
        'Many immigrants do not know the provisions of the Constitution and how it applies to them. For example, there are many immigrants that believe that the Constitution only serves American citizens. This is not true. If your feet are on American soil – the Constitution protects you.',
        <span key="case-law" className="CaseLaw_Emphasis">(See Yick Wo v. Hopkins, 1886; Zadvydas v. Davis, 2001)</span>,
        'The two biggest protections are:',
        <div key="protections" className="space-y-2 ml-4">
          <div className="flex items-start">
            <span className="text-blue-400 mr-2">•</span>
            <span>You cannot be stopped and questioned if you are not doing anything wrong. The police have to have a reason to stop you - they call this Probable Cause.</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-400 mr-2">•</span>
            <span>You do not have to tell anyone anything if you are not doing anything wrong, unless you are in a situation where the law requires you to provide identification, such as in states with "stop and identify" statutes. Looking like an immigrant is not Probable Cause to be stopped. That is Racial Profiling.</span>
          </div>
        </div>,
        'If you have nothing wrong, there should be no reason to answer any of their questions (5th Amendment). In criminal investigations, a judge will sign something called a Warrant, explicitly authorizing officers to arrest you or take you into custody. If they do not have a warrant, and if you have done nothing wrong, the police legally do not have a reason to detain you.',
        'You can ask the police officer "Am I free to go." Saying this statement is within your right and informs law enforcement that you are aware of your rights, and you are clearly asking them to leave. If they keep you anyway - that is a violation of your rights and can be brought to court.'
      ]
    },
    {
      title: 'Proof/Registro',
      icon: FileText,
      content: [
        'In the Proof/Registro panel, you can press the record button. This will turn on your microphone and start recording your conversation.',
        'Do not say anything and press the first button. It is OK if the officer sees this. Recording law enforcement interactions is protected in public spaces under the First Amendment, but be aware that state laws on consent to recording may vary.',
        <span key="case-law" className="CaseLaw_Emphasis">(See Glik v. Cunniffe, 2011; Fordyce v. City of Seattle, 1995)</span>,
        <div key="button-list" className="space-y-2 ml-4">
          <div className="flex items-start">
            <span className="text-blue-400 mr-2">•</span>
            <span>The first button announces a message saying that this conversation is being recorded for your records.</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-400 mr-2">•</span>
            <span>The second button informs the officer that your rights under the US Constitution inform you that you do not have to answer anything if you have not done something wrong.</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-400 mr-2">•</span>
            <span>The third button asks if they can provide their identification – a badge number. This is important for your records as it lets you know who they are.</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-400 mr-2">•</span>
            <span>The fourth button asks if you are free to go.</span>
          </div>
        </div>,
        'These buttons have a "yes or no" at the end of each sentence to make sure the officer knows to say yes or no.',
        'Before you finish, press the goodbye button. This informs the officer that you have kept this for your records and wishes them a good day.',
        'Once it\'s completed, the interaction appears in your saved recordings of interactions. You can hear them or copy them to send to someone else to keep for the records. The interaction also records the date/time and your GPS coordinate of where you were when you recorded this. I would recommend if this happens to you, you should immediately press copy and send this to whoever you would like to have another proof of this record.'
      ]
    }
  ];

  const handleCardClick = (index: number) => {
    setActiveCard(index);
  };

  return (
    <div className="min-h-screen bg-gray-900 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Section Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <button
                key={index}
                onClick={() => handleCardClick(index)}
                className={`p-4 rounded-lg transition-all duration-200 flex flex-col items-center text-center ${
                  activeCard === index
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
                }`}
              >
                <Icon size={32} className={`mb-2 ${activeCard === index ? 'text-white' : 'text-blue-400'}`} />
                <h3 className="text-lg font-semibold">{section.title}</h3>
              </button>
            );
          })}
        </div>

        {/* Active Section Content */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-6 shadow-xl border border-gray-700/50 animate-fadeIn">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            {React.createElement(sections[activeCard].icon, { size: 28, className: "mr-3 text-blue-400" })}
            {sections[activeCard].title}
          </h2>
          
          <div className="space-y-4 text-gray-300">
            {sections[activeCard].content.map((text, i) => (
              <div key={i} className="leading-relaxed">
                {text}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400 mb-4">
              This is a project built by Rafael "RC" Concepcion - If you want to read what inspired this, read it at my blog: <a href="http://aboutrc.com/?p=7682" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">aboutrc.com</a>
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center hidden">
          <p className="text-gray-400 mb-4">
            This is a project built by Rafael "RC" Concepcion - If you want to read what inspired this, read it at my blog: <a href="http://aboutrc.com/?p=7682" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">aboutrc.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;