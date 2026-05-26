// Clinical Food Dataset for AI-Axis Food Recommendation Classifier
// Features: Calories, Carbohydrates, Protein, Fats, Sugars, and Disease suitability boolean tags.
// mealTypes: 'breakfast', 'lunch', 'dinner', 'snack'

export const FOOD_DATASET = [
  {
    name: 'Steamed Rice Cakes (Idli)',
    calories: 120, carbs: 28, protein: 4, fat: 0.5, sugar: 0.2,
    mealTypes: ['breakfast'],
    tags: { diabetes: true, bp: true, anemia: false, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Lentil Vegetable Soup (Sambar)',
    calories: 150, carbs: 18, protein: 6, fat: 2.0, sugar: 1.5,
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Flattened Rice Flakes (Poha)',
    calories: 180, carbs: 35, protein: 3, fat: 2.5, sugar: 0.5,
    mealTypes: ['breakfast'],
    tags: { diabetes: false, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Semolina Porridge (Upma)',
    calories: 190, carbs: 38, protein: 4, fat: 3.0, sugar: 0.6,
    mealTypes: ['breakfast'],
    tags: { diabetes: false, bp: true, anemia: false, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Whole Wheat Flatbread (Chapati)',
    calories: 110, carbs: 22, protein: 3, fat: 1.2, sugar: 0.1,
    mealTypes: ['lunch', 'dinner'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Yellow Lentil Curry (Moong Dal)',
    calories: 140, carbs: 20, protein: 8, fat: 1.5, sugar: 0.3,
    mealTypes: ['lunch', 'dinner'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Spinach Side Dish (Palak Sabji)',
    calories: 70, carbs: 6, protein: 3, fat: 2.0, sugar: 0.1,
    mealTypes: ['lunch', 'dinner'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Bitter Gourd Side Dish (Karela Sabji)',
    calories: 60, carbs: 5, protein: 2, fat: 1.8, sugar: 0.0,
    mealTypes: ['lunch', 'dinner'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Mixed Vegetable Side Dish (Sabji)',
    calories: 90, carbs: 12, protein: 3, fat: 2.2, sugar: 1.2,
    mealTypes: ['lunch', 'dinner'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Light Lentil Rice Porridge (Khichdi)',
    calories: 210, carbs: 39, protein: 7, fat: 1.8, sugar: 0.4,
    mealTypes: ['breakfast', 'dinner'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Fresh Yogurt (Curd)',
    calories: 80, carbs: 5, protein: 6, fat: 3.5, sugar: 3.0,
    mealTypes: ['lunch', 'dinner'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: false, obesity: true, general: true }
  },
  {
    name: 'Scrambled Cottage Cheese (Paneer Bhurji)',
    calories: 180, carbs: 4, protein: 14, fat: 12.0, sugar: 0.8,
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: false, obesity: true, general: true }
  },
  {
    name: 'Mixed Sprouts Salad',
    calories: 130, carbs: 16, protein: 9, fat: 1.0, sugar: 1.1,
    mealTypes: ['snack'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Roasted Chickpeas (Chana)',
    calories: 120, carbs: 19, protein: 6, fat: 1.5, sugar: 0.5,
    mealTypes: ['snack'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Oats porridge with hot milk',
    calories: 160, carbs: 24, protein: 7, fat: 3.2, sugar: 2.8,
    mealTypes: ['breakfast'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Pomegranate bowl',
    calories: 90, carbs: 21, protein: 1.5, fat: 0.6, sugar: 14.0,
    mealTypes: ['snack'],
    tags: { diabetes: false, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Fresh Apple',
    calories: 80, carbs: 20, protein: 0.5, fat: 0.3, sugar: 13.0,
    mealTypes: ['snack'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Fresh Guava',
    calories: 60, carbs: 14, protein: 2.5, fat: 0.7, sugar: 8.0,
    mealTypes: ['snack'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Fresh Banana',
    calories: 105, carbs: 27, protein: 1.3, fat: 0.3, sugar: 14.0,
    mealTypes: ['snack'],
    tags: { diabetes: false, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Boiled Egg White',
    calories: 17, carbs: 0.2, protein: 4.0, fat: 0.1, sugar: 0.0,
    mealTypes: ['breakfast', 'snack'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Boiled Eggs',
    calories: 78, carbs: 0.6, protein: 6.3, fat: 5.3, sugar: 0.0,
    mealTypes: ['breakfast'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: false, obesity: true, general: true }
  },
  {
    name: 'Lean Chicken Curry',
    calories: 220, carbs: 4, protein: 26, fat: 8.0, sugar: 0.2,
    mealTypes: ['lunch', 'dinner'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: false, obesity: true, general: true }
  },
  {
    name: 'Green Tea',
    calories: 2, carbs: 0.1, protein: 0.2, fat: 0.0, sugar: 0.0,
    mealTypes: ['snack'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Buttermilk',
    calories: 40, carbs: 4.8, protein: 3.3, fat: 0.9, sugar: 4.0,
    mealTypes: ['snack', 'lunch'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Steamed Rice',
    calories: 130, carbs: 28, protein: 2.7, fat: 0.3, sugar: 0.1,
    mealTypes: ['lunch'],
    tags: { diabetes: false, bp: true, anemia: false, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Steamed Broccoli',
    calories: 35, carbs: 6.7, protein: 2.8, fat: 0.4, sugar: 1.5,
    mealTypes: ['lunch', 'dinner'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Cabbage Side Dish',
    calories: 50, carbs: 8.0, protein: 1.5, fat: 1.2, sugar: 3.2,
    mealTypes: ['lunch', 'dinner'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Beetroot Salad',
    calories: 45, carbs: 10, protein: 1.6, fat: 0.2, sugar: 7.0,
    mealTypes: ['lunch', 'snack'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Fresh Dates',
    calories: 20, carbs: 5.3, protein: 0.2, fat: 0.0, sugar: 4.8,
    mealTypes: ['snack'],
    tags: { diabetes: false, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Almonds',
    calories: 160, carbs: 6, protein: 6, fat: 14.0, sugar: 1.0,
    mealTypes: ['snack'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Walnuts',
    calories: 185, carbs: 4, protein: 4.3, fat: 18.5, sugar: 0.7,
    mealTypes: ['snack'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Cucumber Salad',
    calories: 15, carbs: 3.6, protein: 0.6, fat: 0.1, sugar: 1.7,
    mealTypes: ['lunch', 'snack'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Warm Tomato Soup',
    calories: 85, carbs: 12, protein: 1.8, fat: 2.2, sugar: 6.4,
    mealTypes: ['dinner'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Baked Beans',
    calories: 110, carbs: 22, protein: 6, fat: 0.6, sugar: 6.0,
    mealTypes: ['breakfast', 'dinner'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Avocado',
    calories: 160, carbs: 8.5, protein: 2.0, fat: 14.7, sugar: 0.7,
    mealTypes: ['breakfast', 'snack'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Oranges',
    calories: 62, carbs: 15.4, protein: 1.2, fat: 0.2, sugar: 12.2,
    mealTypes: ['snack'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  },
  {
    name: 'Fresh Strawberries',
    calories: 32, carbs: 7.7, protein: 0.7, fat: 0.3, sugar: 4.9,
    mealTypes: ['snack'],
    tags: { diabetes: true, bp: true, anemia: true, cholesterol: true, obesity: true, general: true }
  }
];
