// Enhanced category matching with scoring system

interface CategoryKeywords {
  primary: string[];
  secondary?: string[];
  context?: string[];
  crops?: string[];
  produce?: string[];
}

type KeywordSet = Record<string, CategoryKeywords | string[]>;

const expenseKeywords: KeywordSet = {
  'Feed': {
    primary: ['feed', 'hay', 'grain', 'silage', 'straw', 'pellets'],
    secondary: ['corn', 'oats', 'barley', 'wheat', 'soybean', 'alfalfa', 'forage', 'supplement', 'mineral', 'ration'],
    context: ['ton', 'tons', 'bale', 'bales', 'bag', 'bags', 'bushel', 'bushels', 'pound', 'pounds']
  },
  'Fertilizers and lime': {
    primary: ['fertilizer', 'fertilizers', 'lime', 'manure', 'compost'],
    secondary: ['nitrogen', 'phosphorus', 'potash', 'npk', 'urea', 'ammonia', 'phosphate', 'sulfur'],
    context: ['spreading', 'application', 'soil', 'field', 'acre', 'acres']
  },
  'Seeds and plants': {
    primary: ['seed', 'seeds', 'seedling', 'seedlings', 'transplant', 'transplants', 'plant', 'plants'],
    secondary: ['variety', 'varieties', 'hybrid', 'gmo', 'organic', 'starter', 'saplings', 'trees'],
    context: ['planting', 'sowing', 'germination', 'nursery', 'greenhouse']
  },
  'Gasoline, fuel, and oil': {
    primary: ['fuel', 'gas', 'gasoline', 'diesel', 'oil', 'propane'],
    secondary: ['petroleum', 'lubricant', 'hydraulic', 'motor oil', 'transmission', 'grease'],
    context: ['tank', 'gallon', 'gallons', 'fill up', 'station', 'pump', 'liter', 'liters']
  },
  'Veterinary, breeding, and medicine': {
    primary: ['vet', 'veterinary', 'veterinarian', 'medicine', 'vaccine', 'vaccines', 'antibiotic', 'antibiotics'],
    secondary: ['breeding', 'artificial insemination', 'pregnancy', 'health', 'treatment', 'surgery', 'checkup', 'examination'],
    context: ['doctor', 'clinic', 'hospital', 'injection', 'prescription', 'dose', 'medication']
  },
  'Supplies': {
    primary: ['supplies', 'tools', 'equipment', 'hardware', 'parts'],
    secondary: ['rope', 'wire', 'nails', 'screws', 'bolts', 'fencing', 'gates', 'buckets', 'containers'],
    context: ['store', 'shop', 'purchase', 'replacement', 'materials']
  },
  'Repairs and maintenance': {
    primary: ['repair', 'repairs', 'maintenance', 'fix', 'fixing', 'service', 'servicing', 'overhaul'],
    secondary: ['broken', 'damaged', 'replace', 'replacement', 'part', 'mechanic', 'technician'],
    context: ['workshop', 'garage', 'labor', 'hourly', 'breakdown']
  },
  'Labor hired': {
    primary: ['labor', 'worker', 'workers', 'employee', 'employees', 'hired', 'contractor', 'contractors'],
    secondary: ['wages', 'salary', 'hourly', 'seasonal', 'temporary', 'help', 'assistant', 'crew'],
    context: ['payroll', 'hours', 'overtime', 'work', 'job']
  },
  'Utilities': {
    primary: ['electric', 'electricity', 'power', 'water', 'phone', 'internet', 'telephone'],
    secondary: ['utility', 'utilities', 'bill', 'service', 'connection', 'line', 'broadband'],
    context: ['monthly', 'usage', 'meter', 'kwh', 'kilowatt']
  },
  'Insurance (other than health)': {
    primary: ['insurance', 'coverage', 'policy', 'premium', 'premiums'],
    secondary: ['liability', 'property', 'crop', 'equipment', 'fire', 'theft', 'casualty'],
    context: ['annual', 'deductible', 'claim', 'agent']
  },
  'Taxes': {
    primary: ['tax', 'taxes', 'property tax', 'sales tax', 'income tax'],
    secondary: ['assessment', 'levy', 'fee', 'permit', 'license'],
    context: ['government', 'county', 'state', 'federal', 'irs']
  },
  'Other expenses': {
    primary: ['misc', 'miscellaneous', 'other', 'various', 'general'],
    secondary: ['expense', 'cost', 'payment', 'fee'],
    context: ['additional', 'extra', 'supplemental']
  }
};

const incomeKeywords: KeywordSet = {
  'Sales of livestock, produce, grains, and other products you raised': {
    primary: ['cattle', 'cow', 'cows', 'pig', 'pigs', 'hog', 'hogs', 'chicken', 'chickens', 'poultry', 'sheep', 'goat', 'goats'],
    secondary: ['beef', 'pork', 'lamb', 'mutton', 'eggs', 'milk', 'dairy', 'meat', 'livestock'],
    context: ['sold', 'sale', 'market', 'auction', 'buyer', 'head', 'pound', 'pounds', 'dozen'],
    crops: ['corn', 'wheat', 'soybean', 'soybeans', 'oats', 'barley', 'rice', 'cotton', 'tobacco', 'grain', 'grains', 'hay', 'alfalfa', 'silage'],
    produce: ['tomato', 'tomatoes', 'potato', 'potatoes', 'onion', 'onions', 'carrot', 'carrots', 'lettuce', 'cabbage', 'apple', 'apples', 'peach', 'peaches', 'vegetables', 'fruits', 'produce', 'herbs', 'weeds', 'flowers', 'plants']
  },
  'Sales of livestock and other items you bought for resale': {
    primary: ['resale', 'resell', 'trading', 'bought and sold', 'flip', 'flipped'],
    secondary: ['arbitrage', 'broker', 'middleman', 'dealer'],
    context: ['profit', 'margin', 'wholesale', 'retail', 'buy low sell high']
  },
  'Custom hire income': {
    primary: ['custom work', 'hired out', 'contract work', 'service', 'contracting'],
    secondary: ['planting', 'harvesting', 'cultivating', 'spraying', 'hauling', 'tilling'],
    context: ['hourly', 'per acre', 'equipment', 'machinery', 'hire']
  },
  'Agricultural program payments': {
    primary: ['program payment', 'subsidy', 'subsidies', 'conservation', 'government payment'],
    secondary: ['usda', 'crp', 'crop insurance', 'disaster', 'emergency', 'grant'],
    context: ['federal', 'state', 'assistance', 'support', 'program']
  },
  'Other income': {
    primary: ['misc', 'miscellaneous', 'other', 'various', 'additional'],
    secondary: ['rental', 'lease', 'interest', 'dividend', 'bonus'],
    context: ['extra', 'supplemental', 'side']
  }
};

export function matchCategory(text: string, isIncome: boolean): string {
  let bestCategory = '';
  let bestScore = 0;
  
  const keywordSets = isIncome ? incomeKeywords : expenseKeywords;
  
  for (const [category, keywordData] of Object.entries(keywordSets)) {
    let score = 0;
    
    if (Array.isArray(keywordData)) {
      // Handle old format (fallback)
      for (const keyword of keywordData) {
        if (text.includes(keyword)) {
          score += 5;
        }
      }
    } else {
      // Primary keywords (highest weight)
      for (const keyword of keywordData.primary) {
        if (text.includes(keyword)) {
          score += 10;
        }
      }
      
      // Secondary keywords (medium weight)
      if (keywordData.secondary) {
        for (const keyword of keywordData.secondary) {
          if (text.includes(keyword)) {
            score += 5;
          }
        }
      }
      
      // Context keywords (lower weight)
      if (keywordData.context) {
        for (const keyword of keywordData.context) {
          if (text.includes(keyword)) {
            score += 2;
          }
        }
      }
      
      // Crops keywords (medium-high weight)
      if (keywordData.crops) {
        for (const keyword of keywordData.crops) {
          if (text.includes(keyword)) {
            score += 7;
          }
        }
      }
      
      // Produce keywords (medium-high weight)
      if (keywordData.produce) {
        for (const keyword of keywordData.produce) {
          if (text.includes(keyword)) {
            score += 7;
          }
        }
      }
    }
    
    // Bonus for exact category name matches
    if (text.includes(category.toLowerCase())) {
      score += 15;
    }
    
    // Update best match
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }
  
  return bestCategory;
}