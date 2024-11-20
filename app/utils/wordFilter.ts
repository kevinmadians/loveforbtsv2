// Common inappropriate words list
const badWords = [
  'fck', 'sht', 'asshole', 'bitch', 'cunt', 'piss', 'bastard', 
  'whore', 'motherfucker', 'cocksucker', 'nigger', 'kike', 'spic', 
  'chink', 'gook', 'wop', 'raghead', 'jap', 'cracker', 'redneck', 
  'porn', 'sexy', 'fellatio', 'cum', 'vagina', 'penis', 'clit', 
  'dick', 'blowjob', 'tits', 'boobs', 'handjob', 'cock', 'retard', 
  'spaz', 'cripple', 'lesser', 'wanker', 'slut', 'hoe', 'weed', 
  'cocaine', 'meth', 'heroin', 'pot', 'blunt', 'bong', 'drunk', 
  'shitfaced', 'pig', 'ugly', 'nigga', 'niga', 'niggas', 'niggaz', 'niger',
  'faggot', 'fag', 'dyke', 'homo', 'queer', 'paki', 'pedo', 'pedophile',
  'rape', 'rapist', 'molest', 'nazi', 'hooker', 'prostitute', 'twat',
  'pussy', 'thot', 'incel', 'simp', 'tard', 'autist', 'aids', 'std',
  'milf', 'dilf', 'pawg', 'bdsm', 'bondage', 'fetish', 'hentai',
  'perv', 'pervert', 'pron', 'p0rn', 'pr0n', 'fuk', 'fuc', 'fux',
  'sh1t', 'sh!t', 'b!tch', 'b1tch', 'btch', 'azz', 'a$$', '@ss',
  'vugly', 'ygly', 'fuck', 'fucks', 'idiot', 'idiots', 'shit', 'shits', 
  'piss off', 'suck', 'sucker', 'loser', 'bastards', 'bloody',
  'stupid', 'shame', 'losser', 'shut', 'ass', 'fucking', 'fvcking',
  'fu*king', 'dumb', 'die', 'cheat', 'cheating', 'fvck',
  'f*ck', 'fu*k', 'fuc*', 'badass'
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
