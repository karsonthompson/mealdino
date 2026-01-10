import dbConnect from '@/lib/mongodb';
import Recipe from '@/models/Recipe';

// Get only global recipes (available to all users)
export async function GET() {
  try {
    await dbConnect();

    const recipes = await Recipe.find({ isGlobal: true }).sort({ createdAt: -1 });

    // Convert MongoDB documents to plain objects
    const globalRecipes = recipes.map(recipe => ({
      _id: recipe._id.toString(),
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      prepTime: recipe.prepTime,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      macros: recipe.macros,
      imageUrl: recipe.imageUrl,
      userId: recipe.userId ? recipe.userId.toString() : null,
      isGlobal: recipe.isGlobal,
      createdAt: recipe.createdAt ? recipe.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: recipe.updatedAt ? recipe.updatedAt.toISOString() : new Date().toISOString()
    }));

    return Response.json({
      success: true,
      data: globalRecipes,
      count: globalRecipes.length
    });
  } catch (error) {
    console.error('Error fetching global recipes:', error);
    return Response.json(
      {
        success: false,
        message: 'Failed to fetch global recipes'
      },
      { status: 500 }
    );
  }
}