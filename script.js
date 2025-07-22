// Main JavaScript file for Bitebook

// Helper to save recipes array to localStorage
function saveRecipes(recipes) {
  localStorage.setItem('bitebook_recipes', JSON.stringify(recipes));
}

// Helper to load recipes array from localStorage
function loadRecipes() {
  const data = localStorage.getItem('bitebook_recipes');
  return data ? JSON.parse(data) : [];
}

// Helper to render all recipes, with optional category filter
function renderRecipes(recipes, filterCategory = 'all', searchTerm = '') {
  const recipeList = document.getElementById('recipe-list');
  recipeList.innerHTML = '';
  const lowerSearch = searchTerm.trim().toLowerCase();
  recipes.forEach((recipe, idx) => {
    if (filterCategory !== 'all' && recipe.category !== filterCategory) return;
    if (lowerSearch && !recipe.title.toLowerCase().includes(lowerSearch)) return;
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.dataset.index = idx;
    card.innerHTML = `
      <h2>${recipe.title}</h2>
      <div class="recipe-meta"><span class="category-tag">${recipe.category || 'Other'}</span></div>
      ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title} image" class="recipe-img">` : ''}
      <h4>Ingredients</h4>
      <div class="markdown-content">${marked.parse(recipe.ingredients)}</div>
      <h4>Steps</h4>
      <div class="markdown-content">${marked.parse(recipe.steps)}</div>
      <button class="delete-btn">Delete</button>
    `;
    recipeList.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('recipe-form');
  const recipeList = document.getElementById('recipe-list');
  const categoryFilter = document.getElementById('category-filter');
  const imageInput = document.getElementById('image');
  const searchInput = document.getElementById('search');
  const importBtn = document.getElementById('import-recipe-btn');
  let recipes = loadRecipes();
  let currentCategory = 'all';
  let currentSearch = '';
  renderRecipes(recipes, currentCategory, currentSearch);

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const category = document.getElementById('category').value;
    const ingredients = document.getElementById('ingredients').value.trim();
    const steps = document.getElementById('steps').value.trim();
    const file = imageInput.files[0];

    function addRecipe(imageDataUrl) {
      const recipe = { title, category, ingredients, steps };
      if (imageDataUrl) recipe.image = imageDataUrl;
      recipes.push(recipe);
      saveRecipes(recipes);
      renderRecipes(recipes, currentCategory, currentSearch);
      form.reset();
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        addRecipe(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      addRecipe();
    }
  });

  // Event delegation for delete buttons
  recipeList.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-btn')) {
      const card = e.target.closest('.recipe-card');
      if (card) {
        const idx = parseInt(card.dataset.index, 10);
        recipes.splice(idx, 1);
        saveRecipes(recipes);
        renderRecipes(recipes, currentCategory, currentSearch);
      }
    }
  });

  // Category filter
  categoryFilter.addEventListener('change', function(e) {
    currentCategory = e.target.value;
    renderRecipes(recipes, currentCategory, currentSearch);
  });

  // Search filter
  searchInput.addEventListener('input', function(e) {
    currentSearch = e.target.value;
    renderRecipes(recipes, currentCategory, currentSearch);
  });

  // Import random recipe from TheMealDB
  importBtn.addEventListener('click', function() {
    importBtn.disabled = true;
    importBtn.textContent = 'Importing...';
    fetch('https://www.themealdb.com/api/json/v1/1/random.php')
      .then(res => res.json())
      .then(data => {
        const meal = data.meals[0];
        // Gather ingredients and measures
        let ingredients = '';
        for (let i = 1; i <= 20; i++) {
          const ing = meal[`strIngredient${i}`];
          const measure = meal[`strMeasure${i}`];
          if (ing && ing.trim()) {
            ingredients += `- ${measure ? measure.trim() + ' ' : ''}${ing.trim()}\n`;
          }
        }
        // Steps
        const steps = meal.strInstructions || '';
        // Category
        const category = meal.strCategory || 'Other';
        // Image
        const image = meal.strMealThumb || '';
        // Title
        const title = meal.strMeal || 'Imported Recipe';
        // Add to recipes
        const recipe = { title, category, ingredients, steps, image };
        recipes.push(recipe);
        saveRecipes(recipes);
        renderRecipes(recipes, currentCategory, currentSearch);
      })
      .catch(() => alert('Failed to import recipe.'))
      .finally(() => {
        importBtn.disabled = false;
        importBtn.textContent = 'Import Random Recipe';
      });
  });
});
