// Common inappropriate words list
const badWords = [
  'fck', 'sht', 'asshole', 'bitch', 'cunt', 'damn', 'piss', 'bastard', 
  'whore', 'motherfucker', 'cocksucker', 'nigger', 'kike', 'spic', 
  'chink', 'gook', 'wop', 'raghead', 'jap', 'cracker', 'redneck', 
  'porn', 'sexy', 'fellatio', 'cum', 'vagina', 'penis', 'clit', 
  'dick', 'blowjob', 'tits', 'boobs', 'handjob', 'cock', 'retard', 
  'spaz', 'cripple', 'lesser', 'wanker', 'slut', 'hoe', 'weed', 
  'cocaine', 'meth', 'heroin', 'pot', 'blunt', 'bong', 'drunk', 
  'shitfaced', 'pig', 'ugly' , 'nigga', 'niga', 'niggas', 'niggaz' , 'niger'
];

export const containsBadWords = (text: string): { hasBadWords: boolean; foundWords: string[] } => {
  const lowerText = text.toLowerCase();
  const foundWords = badWords.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
  
  return {
    hasBadWords: foundWords.length > 0,
    foundWords
  };
};
