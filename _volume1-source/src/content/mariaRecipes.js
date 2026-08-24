import volumeOneSource from '../../Numero 1.md?raw';

function cleanLine(line) {
  return line.trim().replace(/\\([.\[\]])/g, '$1');
}

function parseRecipe(block) {
  const lines = block.split(/\r?\n/).map(cleanLine);
  const title = lines.shift();
  const recipe = { title, description: [], ingredients: [], steps: [], notes: [] };
  let section = 'description';

  for (const line of lines) {
    if (!line) continue;
    if (line === 'INGREDIENTS') { section = 'ingredients'; continue; }
    if (line === 'STEPS') { section = 'steps'; continue; }
    if (line === 'NOTES') { section = 'notes'; continue; }
    if (section === 'ingredients') recipe.ingredients.push(line.replace(/^•\s*/, ''));
    else if (section === 'steps') recipe.steps.push(line.replace(/^\d+\.\s*/, ''));
    else recipe[section].push(line);
  }
  return recipe;
}

const section = volumeOneSource.match(/# 🟢 Ricettario\s*([\s\S]*?)(?=\n# 🟢 )/)?.[1] ?? '';
const blocks = section.split(/(?=^Ricetta [^\r\n]+$)/gm).filter((block) => /^Ricetta /m.test(block));

export const mariaRecipeIntro = "Ricette suddivise in base all'impatto che avranno sui vicini";

const recipeMetadata = {
  'Ciambellone allo yogurt': {
    displayName: 'Ciambellone allo yogurt',
    odor: 'delicato',
    image: 'assets/maria/recipes/ciambellone-allo-yogurt.jpg',
  },
  'Bagna cauda': {
    displayName: 'Bagna cauda',
    odor: 'forte',
    image: 'assets/maria/recipes/bagnacauda.png',
  },
  'Biscotti al burro': {
    displayName: 'Biscotti al burro',
    odor: 'medio',
    image: 'assets/maria/recipes/biscotti-al-burro.jpg',
  },
  'Cavolfiore gratinato': {
    displayName: 'Cavolfiore gratinato',
    odor: 'medio',
    image: 'assets/maria/recipes/cavolfiore-gratinato.jpg',
  },
  'Fritto misto': {
    displayName: 'Fritto misto',
    odor: 'forte',
    image: 'assets/maria/recipes/fritto-misto.jpg',
  },
  'Ragù della domenica': {
    displayName: 'Ragù della domenica',
    odor: 'forte',
    image: 'assets/maria/recipes/ragu-della-domenica.jpg',
  },
};

export const mariaRecipes = blocks.map(parseRecipe).map((recipe) => {
  const displayName = recipe.title.split('—').at(-1)?.trim() ?? recipe.title;
  return { ...recipe, ...(recipeMetadata[displayName] ?? { displayName }) };
});
