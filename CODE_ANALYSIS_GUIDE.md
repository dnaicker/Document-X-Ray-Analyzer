# AI Code Analysis Feature Guide

## Overview

The AI Code Analysis feature uses advanced language models (OpenAI GPT-4, Google Gemini, or Local Ollama) to intelligently analyze source code and provide architectural insights, helping you understand:

- 🏗️ **Architecture patterns** and design principles
- 🔗 **Code connections** and dependencies
- ⚡ **Key functions** and their importance
- 🎨 **Design patterns** in use
- ⭐ **Code quality** assessment
- 💡 **Improvement suggestions**

This powerful feature helps you quickly understand unfamiliar codebases, identify architectural patterns, and see how different parts of your project connect together.

## ✨ Enhanced AI Code Analysis (Latest Update)

The AI code analysis has been significantly enhanced to provide comprehensive insights for source code files!

### What's New:

#### 🎯 **SOLID Principles Analysis**
- Evaluates compliance with all 5 SOLID principles
- Provides specific explanations for each principle
- Helps identify architectural violations

#### 🔒 **Security Analysis**
- Detects potential security concerns
- Identifies injection vulnerabilities
- Suggests security improvements
- Checks input validation patterns

#### ⚡ **Performance Analysis**
- Identifies performance bottlenecks
- Detects resource leaks
- Suggests optimization strategies
- Analyzes async patterns

#### 🧪 **Testing Recommendations**
- Evaluates testability (high/medium/low)
- Identifies testing challenges
- Suggests specific test types
- Highlights hard-to-test code

#### 🧮 **Algorithmic Insights**
- Detects algorithms with complexity analysis
- Identifies data structures used
- Explains algorithmic approaches
- Provides optimization suggestions

#### 📚 **Documentation Quality**
- Assesses documentation completeness
- Identifies undocumented code
- Suggests what needs documentation

#### 🎨 **Enhanced Pattern Detection**
- Pattern strength ratings (excellent/good/weak)
- Benefits and concerns for each pattern
- More detailed pattern explanations
- Anti-pattern detection

#### ⭐ **Detailed Code Quality**
- Cyclomatic complexity scores
- Code smells detection
- Strengths and weaknesses
- Actionable improvement suggestions
- Maintainability reasoning

#### 📦 **Expanded Dependencies**
- Internal vs external dependencies
- Third-party library tracking
- Interface implementations
- Composition relationships

#### ⚡ **Enhanced Function Analysis**
- Function complexity ratings
- Parameter information
- Line number references
- Importance and complexity tags

---

### Example: Enhanced Analysis Output

**Before (Basic Analysis):**
```
Function: _ready
Purpose: Initializes game components
Importance: HIGH
```

**After (Enhanced Analysis):**
```
Function: _ready
Purpose: Initializes game components and establishes connections
 between UI elements, timing system, and ability management
Importance: HIGH
Complexity: MEDIUM
Parameters: None (Godot lifecycle method)
Line: 15
```

**New Sections Added:**

```
🎯 SOLID Principles Compliance
├─ Single Responsibility: YES - GameManager focuses solely on
│  game flow coordination
├─ Open/Closed: PARTIAL - Adding new game modes requires
│  modification
├─ Dependency Inversion: YES - Depends on signals/events,
│  not concrete implementations

🔒 Security Analysis
⚠️ Potential Concerns:
• User input from TimingBar not validated before processing
✓ Recommendations:
• Add input validation for timing judgments
• Implement rate limiting for rapid inputs

⚡ Performance Analysis
⚠️ Potential Bottlenecks:
• Multiple signal connections in _ready could be optimized
🚀 Suggested Optimizations:
• Consider connection pooling for frequently fired signals
• Cache references to frequently accessed nodes

🧪 Testing Recommendations
Testability: MEDIUM
⚠️ Testing Challenges:
• Tight coupling with Godot scene tree
• Signal-based architecture requires mock setup
✓ Suggested Tests:
• Unit tests for scoring logic
• Integration tests for timing judgment flow
• Mock signal tests for state transitions

🧮 Algorithmic Insights
Algorithm: Event-driven state machine
Location: Throughout class (_on_judged, _on_ability_used)
Complexity: O(1) for state transitions
Purpose: Manages game flow based on player actions

📚 Documentation Quality
Quality: MINIMAL
📝 Needs Documentation:
• Document signal connection patterns
• Add comments explaining scoring algorithm
• Document state transition logic
```

---

## Getting Started

### 1. Choose Your AI Provider

You have three options:

#### Option A: Local Ollama (Recommended ⭐)
**Best for privacy and unlimited use!**

1. Install Ollama from [ollama.com](https://ollama.com)
2. Open terminal and run: `ollama pull llama3.2`
3. Start Ollama: `ollama serve`
4. In the app, select "Local Ollama" - Done!

See `OLLAMA_SETUP_GUIDE.md` for detailed instructions.

#### Option B: Google Gemini (Free Online)
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Paste it in the AI Analysis section
3. Click Save

**Free Tier**: 15 requests/min, 1,500/day - No credit card required!

#### Option C: OpenAI GPT-4
1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Paste it in the AI Analysis section
3. Click Save

**Note**: OpenAI requires billing setup.

### 2. Open a Source Code File

Open any supported code file:
- JavaScript/TypeScript (`.js`, `.jsx`, `.ts`, `.tsx`)
- Python (`.py`)
- Java (`.java`)
- C/C++ (`.c`, `.cpp`, `.h`, `.hpp`)
- C# (`.cs`)
- Go (`.go`)
- Rust (`.rs`)
- PHP (`.php`)
- Ruby (`.rb`)
- Swift (`.swift`)
- Kotlin (`.kt`)
- GDScript (`.gd`)
- And 50+ more languages!

### 3. Run Code Analysis

#### Single File Analysis
1. Open a code file
2. Navigate to the **Analyze** tab
3. Scroll down to **🤖 AI Semantic Analysis**
4. Click **🚀 Analyze Current File**
5. Wait 10-30 seconds while the AI analyzes your code
6. View results in the AI Analysis tab

#### Folder Analysis (Recommended for Projects) ⭐
1. Import your project folder (File → Open Folder...)
2. Open any file in that project
3. Navigate to the **Analyze** tab  
4. Scroll down to **🤖 AI Semantic Analysis**
5. Click **📁 Analyze Current Folder**
6. Confirm the folder analysis
7. Wait while the AI analyzes all code files in that folder (progress shown)
8. View **folder-level insights** showing:
   - Architecture patterns across the folder
   - Critical functions across all files
   - Code quality distribution
   - Design patterns used
   - Individual file results

**Benefits**: 
- Only analyzes the specific project you're working on
- Faster than analyzing the entire library
- More focused insights

#### Full Library Analysis
1. Navigate to the **Analyze** tab  
2. Scroll down to **🤖 AI Semantic Analysis**
3. Click **📊 Analyze All Files in Library**
4. Confirm (this will analyze ALL code files in your library)
5. Wait while the AI analyzes everything

**Use when**: You want insights across multiple projects in your library

## Features

### 🏗️ Architecture Pattern Detection

The AI automatically identifies common architectural patterns in your code:

- **MVC** (Model-View-Controller)
- **MVVM** (Model-View-ViewModel)
- **Observer Pattern**
- **Factory Pattern**
- **Singleton Pattern**
- **Repository Pattern**
- **Service Layer**
- **Dependency Injection**
- And many more!

**Example Result:**
```
Architecture: MVC Pattern
Description: This file implements a Controller component that handles 
user requests and coordinates between Model and View layers.
Components: UserController, ValidationMiddleware, ResponseHandler
```

### ⚡ Key Functions Analysis

Identifies the most important functions in your code with:
- **Function name** and signature
- **Purpose** - What it does
- **Importance level** - High/Medium/Low

**Example:**
```
Function: processUserData
Purpose: Validates and transforms user input before database storage
Importance: HIGH
```

This helps you quickly understand which functions are critical to the codebase.

### 📦 Dependencies & Connections

Maps out all dependencies and connections:

- **Imports** - What external modules this file uses
- **Exports** - What this file provides to others
- **External APIs** - Third-party services called
- **Related Files** - Other files this connects to
- **Used By** - Potential consumers of this code
- **Extends** - Parent classes or base modules

**Example:**
```
IMPORTS:
  - express
  - mongoose
  - authMiddleware

EXPORTS:
  - UserController
  - validateUser

EXTERNAL APIs:
  - Stripe Payment API
  - SendGrid Email API
```

This visualization helps you understand how code fits into the larger project.

### 🎨 Design Pattern Detection

Identifies specific design patterns used in the code:

```
Pattern: Observer Pattern
Description: Event listener system for user actions
Examples: addEventListener, notifyListeners, eventEmitter

Pattern: Factory Pattern
Description: UserFactory creates different types of user objects
Examples: createAdminUser, createGuestUser, createPremiumUser
```

**💡 UI Enhancement Suggestion**: Pattern details could be displayed in an interactive modal popup when clicked, showing:
- Full pattern explanation with diagrams
- Code examples from your file
- Related patterns in the same file/project
- Best practices and common pitfalls
- Refactoring suggestions specific to this pattern
- Links to pattern documentation

This would provide rich context without cluttering the main analysis view.

## 🔬 Deep Dive: How AI Analysis Works

### Overview of the Analysis Pipeline

The AI code analysis uses a multi-stage pipeline to extract deep insights from source code:

```
1. Code Ingestion → 2. Lexical Analysis → 3. Semantic Parsing → 
4. Pattern Recognition → 5. Relationship Mapping → 6. Quality Assessment → 
7. Insight Generation → 8. Result Formatting
```

Each stage employs specific algorithms and AI techniques to build a comprehensive understanding of your code.

---

## 🎯 Design Pattern Detection - Complete Reference

### Creational Patterns

#### **Singleton Pattern**
**Detection Algorithm:**
- Searches for private constructors or getInstance() methods
- Identifies static instance variables
- Looks for lazy initialization patterns
- Checks for thread-safety mechanisms (locks, synchronized)

**Code Signatures:**
```javascript
class Singleton {
  private static instance: Singleton;
  private constructor() {}
  public static getInstance(): Singleton {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }
}
```

**Analysis Keys:**
- Static member holding instance
- Private/protected constructor
- Public accessor method
- Single responsibility focus

#### **Factory Pattern**
**Detection Algorithm:**
- Identifies methods returning interface/base class types
- Looks for conditional object creation (switch/if statements)
- Detects method names containing: create*, make*, build*, get*Instance
- Analyzes parameter-based instantiation logic

**Code Signatures:**
```python
class UserFactory:
    def create_user(self, user_type):
        if user_type == "admin":
            return AdminUser()
        elif user_type == "guest":
            return GuestUser()
        return StandardUser()
```

**Analysis Keys:**
- Factory method pattern (method returns objects)
- Abstract factory pattern (family of related objects)
- Multiple product variants
- Decoupled object creation

#### **Builder Pattern**
**Detection Algorithm:**
- Identifies fluent interfaces (method chaining)
- Looks for methods returning 'this' or 'self'
- Detects build() or construct() terminal methods
- Analyzes step-by-step object construction

**Code Signatures:**
```java
QueryBuilder builder = new QueryBuilder()
    .select("*")
    .from("users")
    .where("age > 18")
    .orderBy("name")
    .build();
```

**Analysis Keys:**
- Method chaining pattern
- Immutable builder state
- Complex object assembly
- Separate construction from representation

#### **Prototype Pattern**
**Detection Algorithm:**
- Searches for clone() or copy() methods
- Identifies deep/shallow copy implementations
- Looks for Cloneable interface implementations
- Detects object copying instead of instantiation

**Analysis Keys:**
- Clone method presence
- Copy constructors
- Object duplication logic
- Performance optimization through copying

---

### Structural Patterns

#### **Adapter Pattern**
**Detection Algorithm:**
- Identifies wrapper classes around existing classes
- Looks for interface implementation with delegation
- Detects translation/conversion methods
- Analyzes incompatible interface bridging

**Code Signatures:**
```typescript
class PaymentAdapter implements PaymentProcessor {
  private legacyPayment: OldPaymentSystem;
  
  constructor(legacy: OldPaymentSystem) {
    this.legacyPayment = legacy;
  }
  
  processPayment(amount: number) {
    // Adapt new interface to old implementation
    return this.legacyPayment.oldProcessMethod(amount);
  }
}
```

**Analysis Keys:**
- Wrapping existing functionality
- Interface translation
- Legacy system integration
- Composition over inheritance

#### **Decorator Pattern**
**Detection Algorithm:**
- Identifies classes wrapping same interface
- Looks for enhanced/extended behavior
- Detects dynamic responsibility addition
- Analyzes nested wrapper chains

**Code Signatures:**
```python
class CompressionDecorator(DataStream):
    def __init__(self, stream: DataStream):
        self.stream = stream
    
    def write(self, data):
        compressed = self.compress(data)
        self.stream.write(compressed)
```

**Analysis Keys:**
- Interface conformance
- Behavior enhancement
- Composable functionality
- Runtime decoration

#### **Facade Pattern**
**Detection Algorithm:**
- Identifies simplified interfaces to complex subsystems
- Looks for classes coordinating multiple components
- Detects unified API entry points
- Analyzes delegation to multiple internal systems

**Code Signatures:**
```csharp
class HomeTheaterFacade {
    private DVDPlayer dvd;
    private Projector projector;
    private SoundSystem sound;
    
    public void watchMovie(string movie) {
        projector.on();
        sound.setVolume(10);
        dvd.play(movie);
    }
}
```

**Analysis Keys:**
- Subsystem coordination
- Simplified interface
- Multiple internal dependencies
- High-level operations

#### **Proxy Pattern**
**Detection Algorithm:**
- Identifies surrogate/placeholder classes
- Looks for lazy loading implementations
- Detects access control mechanisms
- Analyzes remote object representations

**Code Signatures:**
```java
class ImageProxy implements Image {
    private String filename;
    private RealImage image;
    
    public void display() {
        if (image == null) {
            image = new RealImage(filename); // Lazy load
        }
        image.display();
    }
}
```

**Analysis Keys:**
- Lazy initialization
- Access control
- Remote proxy
- Caching proxy

---

### Behavioral Patterns

#### **Observer Pattern (Pub-Sub)**
**Detection Algorithm:**
- Searches for event listener registration (addEventListener, on, subscribe)
- Identifies event emitter/dispatcher classes
- Looks for notify/broadcast methods
- Detects observer lists/arrays
- Analyzes callback function patterns

**Code Signatures:**
```javascript
class EventEmitter {
    listeners = {};
    
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    emit(event, data) {
        this.listeners[event]?.forEach(cb => cb(data));
    }
}
```

**Analysis Keys:**
- Subject-Observer relationship
- Event-driven architecture
- One-to-many dependency
- Loose coupling through events

#### **Strategy Pattern**
**Detection Algorithm:**
- Identifies interchangeable algorithm families
- Looks for interface/abstract class with multiple implementations
- Detects runtime algorithm selection
- Analyzes dependency injection of behaviors

**Code Signatures:**
```python
class SortStrategy(ABC):
    @abstractmethod
    def sort(self, data): pass

class QuickSort(SortStrategy):
    def sort(self, data):
        # Quick sort implementation
        pass

class Context:
    def __init__(self, strategy: SortStrategy):
        self.strategy = strategy
    
    def execute_sort(self, data):
        return self.strategy.sort(data)
```

**Analysis Keys:**
- Algorithm encapsulation
- Runtime behavior switching
- Strategy injection
- Open/closed principle adherence

#### **Command Pattern**
**Detection Algorithm:**
- Identifies command/action objects
- Looks for execute() or run() methods
- Detects undo/redo implementations
- Analyzes request encapsulation

**Code Signatures:**
```typescript
interface Command {
    execute(): void;
    undo(): void;
}

class CopyCommand implements Command {
    execute() { /* copy logic */ }
    undo() { /* undo copy */ }
}

class CommandInvoker {
    private history: Command[] = [];
    
    executeCommand(cmd: Command) {
        cmd.execute();
        this.history.push(cmd);
    }
}
```

**Analysis Keys:**
- Request encapsulation
- Undo/redo support
- Command queuing
- Macro commands

#### **State Pattern**
**Detection Algorithm:**
- Identifies context-dependent behavior
- Looks for state classes/enums
- Detects state transition logic
- Analyzes behavior changes based on internal state

**Code Signatures:**
```java
interface State {
    void handle(Context context);
}

class Context {
    private State state;
    
    void setState(State state) {
        this.state = state;
    }
    
    void request() {
        state.handle(this);
    }
}
```

**Analysis Keys:**
- State-dependent behavior
- State transitions
- Context object
- Behavior encapsulation per state

#### **Chain of Responsibility**
**Detection Algorithm:**
- Identifies linked handler chains
- Looks for next/successor references
- Detects request passing logic
- Analyzes sequential processing

**Code Signatures:**
```javascript
class Handler {
    constructor(successor) {
        this.successor = successor;
    }
    
    handleRequest(request) {
        if (this.canHandle(request)) {
            return this.process(request);
        } else if (this.successor) {
            return this.successor.handleRequest(request);
        }
    }
}
```

**Analysis Keys:**
- Handler chain
- Responsibility delegation
- Request passing
- Decoupled sender/receiver

---

### Architectural Patterns

#### **MVC (Model-View-Controller)**
**Detection Algorithm:**
- Identifies three-layer separation
- Looks for:
  - **Models**: Data structures, business logic, database interaction
  - **Views**: UI components, templates, presentation logic
  - **Controllers**: Request handlers, route definitions, user input processing
- Analyzes data flow patterns
- Detects separation of concerns

**Code Signatures:**
```ruby
# Model
class User < ActiveRecord::Base
    validates :email, presence: true
end

# View
<h1>Welcome <%= @user.name %></h1>

# Controller
class UsersController < ApplicationController
    def show
        @user = User.find(params[:id])
        render :show
    end
end
```

**Analysis Keys:**
- Three-tier architecture
- Data-UI separation
- Controller coordination
- Model independence

#### **Repository Pattern**
**Detection Algorithm:**
- Identifies data access abstraction layers
- Looks for CRUD operation interfaces
- Detects database query encapsulation
- Analyzes collection-like interfaces

**Code Signatures:**
```csharp
interface IUserRepository {
    User GetById(int id);
    void Add(User user);
    void Update(User user);
    void Delete(int id);
    IEnumerable<User> GetAll();
}

class UserRepository : IUserRepository {
    private DbContext _context;
    
    public User GetById(int id) {
        return _context.Users.Find(id);
    }
}
```

**Analysis Keys:**
- Data access abstraction
- CRUD operations
- Database independence
- Testability through interfaces

#### **Dependency Injection**
**Detection Algorithm:**
- Identifies constructor/setter injection
- Looks for interface/abstract dependencies
- Detects IoC container usage
- Analyzes dependency inversion

**Code Signatures:**
```typescript
class UserService {
    constructor(
        private userRepo: IUserRepository,
        private emailService: IEmailService,
        private logger: ILogger
    ) {}
    
    async createUser(data: UserData) {
        const user = await this.userRepo.create(data);
        await this.emailService.sendWelcome(user);
        this.logger.info('User created', user.id);
    }
}
```

**Analysis Keys:**
- Constructor injection
- Interface dependencies
- Loose coupling
- Testability and mockability

---

## 🔗 Code Relationships - Deep Analysis

### Relationship Types and Detection

#### **1. Inheritance Relationships**
**Detection Algorithm:**
- Parses class declarations for extends/inherits keywords
- Identifies parent-child hierarchies
- Analyzes method overriding
- Builds inheritance trees

**Examples:**
```python
class Animal:          # Base class
    def speak(self): pass

class Dog(Animal):     # Inherits from Animal
    def speak(self):   # Overrides speak
        return "Woof"
```

**Relationship Metadata:**
- Parent class name
- Overridden methods
- Inherited properties
- Hierarchy depth

#### **2. Composition Relationships**
**Detection Algorithm:**
- Identifies member variables of class types
- Analyzes "has-a" relationships
- Detects object embedding
- Tracks ownership relationships

**Examples:**
```java
class Car {
    private Engine engine;     // Composition
    private Wheel[] wheels;    // Composition
    
    public Car() {
        this.engine = new Engine();
        this.wheels = new Wheel[4];
    }
}
```

**Relationship Metadata:**
- Composed types
- Ownership semantics
- Lifecycle management
- Cardinality (one-to-one, one-to-many)

#### **3. Dependency Relationships**
**Detection Algorithm:**
- Analyzes import/require statements
- Tracks method parameter types
- Identifies local variable types
- Detects return type dependencies

**Examples:**
```typescript
import { Logger } from './logger';    // Import dependency
import { Database } from './db';      // Import dependency

class UserService {
    process(user: User) {             // Parameter dependency
        const validator = new Validator(); // Local dependency
        return validator.validate(user);
    }
}
```

**Relationship Metadata:**
- Direct dependencies
- Transitive dependencies
- Dependency direction
- Coupling strength

#### **4. Association Relationships**
**Detection Algorithm:**
- Identifies method calls between classes
- Analyzes bidirectional references
- Detects collaboration patterns
- Tracks message passing

**Examples:**
```csharp
class Customer {
    private List<Order> orders;
    
    public void placeOrder(Order order) {
        orders.Add(order);
        order.setCustomer(this);  // Bidirectional association
    }
}
```

**Relationship Metadata:**
- Associated classes
- Directionality
- Multiplicity
- Navigability

#### **5. Aggregation Relationships**
**Detection Algorithm:**
- Identifies weak ownership (passed via constructor/setter)
- Analyzes shared object references
- Detects collection memberships
- Distinguishes from composition

**Examples:**
```java
class Department {
    private List<Employee> employees;
    
    public void addEmployee(Employee emp) {
        employees.add(emp);  // Aggregation (employee can exist independently)
    }
}
```

**Relationship Metadata:**
- Container-contained relationships
- Shared ownership
- Lifecycle independence
- Collection types

---

### Relationship Graph Construction

#### **Algorithm: Dependency Graph Builder**

```
1. Parse all import/require statements
2. Extract class/function definitions
3. For each entity:
   a. Identify direct dependencies (imports, parameters)
   b. Find usage relationships (method calls, property access)
   c. Detect inheritance chains
   d. Map composition relationships
4. Build directed graph:
   - Nodes: Classes, modules, functions
   - Edges: Dependency types (import, extends, uses, contains)
   - Weights: Coupling strength (call frequency, data sharing)
5. Calculate metrics:
   - In-degree: How many depend on this
   - Out-degree: How many this depends on
   - Centrality: Importance in the system
   - Coupling coefficient: Strength of dependencies
```

#### **Relationship Strength Scoring**

The AI calculates coupling strength using multiple factors:

```
Coupling Score = w1 × (import_count) + 
                 w2 × (method_call_frequency) + 
                 w3 × (data_sharing_intensity) + 
                 w4 × (inheritance_depth)

Where:
- w1, w2, w3, w4 are weights (typically w2 > w1 > w3 > w4)
- import_count: Number of imports from a module
- method_call_frequency: How often methods are called
- data_sharing_intensity: Amount of data passed between components
- inheritance_depth: How deep in the hierarchy
```

**Interpretation:**
- **High coupling (score > 0.7)**: Strong dependency, changes likely impact both
- **Medium coupling (0.3-0.7)**: Moderate dependency, some impact expected
- **Low coupling (< 0.3)**: Weak dependency, changes mostly isolated

---

## 🧮 Key Algorithms Used in Analysis

### 1. **Abstract Syntax Tree (AST) Parsing**

**Purpose**: Convert source code into a structured tree representation

**How it works:**
```
Source Code → Lexical Analysis → Tokens → Syntax Analysis → AST
```

**Example:**
```javascript
// Code:
const x = 5 + 3;

// AST Representation:
{
  type: "VariableDeclaration",
  kind: "const",
  declarations: [{
    id: { type: "Identifier", name: "x" },
    init: {
      type: "BinaryExpression",
      operator: "+",
      left: { type: "Literal", value: 5 },
      right: { type: "Literal", value: 3 }
    }
  }]
}
```

**AI Application:**
- Extracts function signatures
- Identifies class hierarchies
- Maps variable scope
- Detects code structures

### 2. **Control Flow Analysis**

**Purpose**: Understand execution paths through code

**Algorithm: Control Flow Graph (CFG) Construction**

```
1. Identify basic blocks (sequential code with no branches)
2. Create nodes for each block
3. Add edges for control flow:
   - Sequential: A → B
   - Conditional: if → then_block | else_block
   - Loops: loop_start ↔ loop_body
   - Function calls: caller → callee → return
4. Calculate:
   - Cyclomatic complexity: M = E - N + 2P
     (E=edges, N=nodes, P=connected components)
   - Reachability: Which blocks can reach others
   - Dominators: Blocks that must execute before others
```

**AI Application:**
- Complexity assessment
- Dead code detection
- Test coverage planning
- Optimization opportunities

### 3. **Data Flow Analysis**

**Purpose**: Track how data moves through code

**Algorithm: Reaching Definitions**

```
For each program point:
1. IN[B] = Union of OUT[predecessors of B]
2. OUT[B] = (IN[B] - KILL[B]) ∪ GEN[B]

Where:
- GEN[B]: Definitions generated in block B
- KILL[B]: Definitions killed (overwritten) in B
- IN[B]: Definitions reaching the start of B
- OUT[B]: Definitions reaching the end of B
```

**AI Application:**
- Unused variable detection
- Potential null pointer analysis
- Data dependency tracking
- Optimization suggestions

### 4. **Pattern Matching with NLP**

**Purpose**: Identify design patterns using natural language understanding

**Algorithm: Semantic Pattern Recognition**

```
1. Extract code features:
   - Class/method names
   - Method signatures
   - Call patterns
   - Structural relationships

2. Create feature vector:
   features = [
     has_getInstance: boolean,
     has_private_constructor: boolean,
     has_static_instance: boolean,
     class_name_contains_singleton: boolean,
     ...
   ]

3. Apply trained classifier:
   pattern_scores = neural_network(features)
   
4. Threshold and rank:
   detected_patterns = filter(pattern_scores > threshold)
```

**AI Models Used:**
- Transformer-based models (GPT-4, Gemini, Llama)
- Fine-tuned on code pattern datasets
- Contextual understanding of code semantics
- Multi-language pattern recognition

### 5. **Complexity Metrics Calculation**

#### **Cyclomatic Complexity**
```
M = E - N + 2P

Where:
- E = number of edges in control flow graph
- N = number of nodes
- P = number of connected components (usually 1)

Alternatively:
M = number_of_decision_points + 1
```

**Interpretation:**
- 1-10: Simple, low risk
- 11-20: Moderate complexity
- 21-50: Complex, high risk
- >50: Untestable, very high risk

#### **Halstead Complexity Measures**
```
n1 = number of distinct operators
n2 = number of distinct operands
N1 = total number of operators
N2 = total number of operands

Program Length:     N = N1 + N2
Vocabulary:         n = n1 + n2
Volume:             V = N × log2(n)
Difficulty:         D = (n1/2) × (N2/n2)
Effort:             E = D × V
Time to Program:    T = E / 18 seconds
Bugs Delivered:     B = V / 3000
```

#### **Maintainability Index**
```
MI = 171 - 5.2 × ln(V) - 0.23 × M - 16.2 × ln(LOC)

Where:
- V = Halstead Volume
- M = Cyclomatic Complexity
- LOC = Lines of Code

Scale:
- 85-100: Highly maintainable
- 65-85: Moderately maintainable
- <65: Difficult to maintain
```

### 6. **Semantic Similarity Analysis**

**Purpose**: Find related code sections and suggest connections

**Algorithm: Code Embedding**

```
1. Tokenize code into semantic units
2. Generate embeddings using transformer models:
   embedding = BERT_for_Code(code_snippet)
   
3. Calculate similarity:
   similarity = cosine_similarity(emb1, emb2)
   = (emb1 · emb2) / (||emb1|| × ||emb2||)
   
4. Cluster similar code:
   - Use DBSCAN or K-means on embeddings
   - Group functionally related code
   - Identify potential refactoring opportunities
```

**AI Application:**
- Finding duplicate logic
- Suggesting code reuse
- Identifying related files
- Recommending modularization

### 7. **Call Graph Analysis**

**Purpose**: Map function call relationships

**Algorithm: Call Graph Construction**

```
1. Static Analysis:
   For each function F:
     - Parse function body
     - Extract all function calls
     - Add edges: F → called_function
     
2. Handle dynamic calls:
   - Identify function pointers/callbacks
   - Trace interface implementations
   - Resolve virtual method calls
   
3. Calculate metrics:
   - Fan-out: Number of functions F calls
   - Fan-in: Number of functions that call F
   - Call depth: Maximum call chain length
   - Recursive cycles: Detect self-calling patterns
```

**Visualization:**
```
main()
├── initializeApp()
│   ├── loadConfig()
│   └── setupDatabase()
│       └── connectToServer()
├── startServer()
│   ├── createRoutes()
│   └── listen()
└── handleRequests()
    ├── parseRequest()
    ├── authenticate()
    └── sendResponse()
```

### 8. **Dependency Rank Algorithm (PageRank for Code)**

**Purpose**: Identify most critical components

**Algorithm:**

```
Similar to Google's PageRank, but for code modules:

PR(A) = (1-d) + d × Σ(PR(T_i) / C(T_i))

Where:
- PR(A) = PageRank of module A
- d = damping factor (typically 0.85)
- T_i = modules that depend on A
- C(T_i) = number of outgoing dependencies from T_i

Iterate until convergence:
  While change > threshold:
    For each module M:
      PR_new(M) = calculate_rank(M, dependents)
```

**AI Application:**
- Identify critical modules (high PR = many depend on it)
- Prioritize testing efforts
- Guide refactoring decisions
- Assess change impact

---

## 📊 Analysis Depth Levels

### Level 1: Surface Analysis (Fast)
**Time**: 5-10 seconds per file
**Methods:**
- AST parsing
- Simple pattern matching
- Import/export extraction
- Basic metrics (LOC, function count)

**Output:**
- File purpose
- Basic architecture
- Direct dependencies

### Level 2: Structural Analysis (Medium)
**Time**: 15-30 seconds per file
**Methods:**
- Control flow analysis
- Data flow tracking
- Design pattern detection
- Complexity calculation
- Call graph construction

**Output:**
- Design patterns
- Key functions
- Complexity metrics
- Internal relationships

### Level 3: Deep Semantic Analysis (Slow)
**Time**: 30-60 seconds per file
**Methods:**
- AI model inference (GPT-4/Gemini/Llama)
- Semantic understanding
- Cross-file relationship mapping
- Quality assessment
- Improvement recommendations

**Output:**
- Comprehensive insights
- Quality suggestions
- Refactoring opportunities
- Best practice compliance

---

## 🎨 Visualization Concepts (Future Enhancement)

### Interactive Pattern Modal

**Suggested UI Design:**

```
┌─────────────────────────────────────────────────────────┐
│  🎨 Singleton Pattern Detected                      [×] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📖 Pattern Description:                               │
│  Ensures a class has only one instance and provides    │
│  a global point of access to it.                       │
│                                                         │
│  ├─ Category: Creational Pattern                       │
│  ├─ Confidence: 95%                                    │
│  └─ Detected at: lines 15-42                           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  💻 Your Code:                                         │
│                                                         │
│  [Code snippet with highlighted pattern lines]         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  🔍 Pattern Elements Found:                            │
│  ✓ Private constructor (line 18)                       │
│  ✓ Static instance variable (line 16)                  │
│  ✓ getInstance() method (line 25)                      │
│  ✓ Lazy initialization (line 27)                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  💡 Best Practices:                                    │
│  ⚠ Consider thread-safety for multi-threaded apps     │
│  ✓ Good: Using lazy initialization                     │
│  💡 Tip: Consider using dependency injection instead   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  🔗 Related Patterns in This Project:                  │
│  • Factory Pattern (UserFactory.js, line 45)           │
│  • Dependency Injection (AppModule.js, line 12)        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  📚 Learn More:                                        │
│  [View Pattern Documentation]  [See Examples]          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Relationship Graph Visualization

**Suggested UI:**

```
      [UserController.js]
            │
            ├──imports──→ [UserService.js]
            │                    │
            │                    ├──uses──→ [UserRepository.js]
            │                    │                │
            │                    │                └──uses──→ [Database.js]
            │                    │
            │                    └──uses──→ [EmailService.js]
            │
            └──extends──→ [BaseController.js]

Legend:
──imports──→  Import dependency
──extends──→  Inheritance
──uses──────→  Composition/Usage
──calls────→  Method calls

Node colors:
🔴 High complexity
🟡 Medium complexity
🟢 Low complexity

Node size:
Large = High centrality (many dependencies)
Small = Low centrality (isolated)
```

### Complexity Heatmap

**Suggested UI:**

```
File                          Complexity    Maintainability    Issues
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UserController.js             ████████░░ 8  ██████████ 10     None
AuthService.js                ██████████ 10 ████████░░ 8      ⚠ 2
PaymentProcessor.js           ████████████░ 12 ████░░░░░░ 4   ⚠ 5
Database.js                   ██░░░░░░░░ 2  ██████████ 10     None
EmailService.js               ████░░░░░░ 4  ██████████ 9      None

Color scale:
🟢 Green (1-5): Simple, maintainable
🟡 Yellow (6-10): Moderate complexity
🟠 Orange (11-15): Complex, needs attention
🔴 Red (>15): Very complex, refactor recommended
```

---

## 🚀 Performance Optimization in Analysis

### Caching Strategy

**Multi-Level Cache:**

```
1. Memory Cache (L1):
   - Recently analyzed files
   - Fast lookup (< 1ms)
   - Limited size (100 files)

2. IndexedDB Cache (L2):
   - All analyzed files
   - Persistent across sessions
   - Lookup time (5-10ms)
   - Size: ~50MB

3. File Hash Verification:
   - Hash = SHA-256(file_content)
   - Invalidate cache if hash changes
   - Partial analysis for small changes
```

### Incremental Analysis

```
When file changes:
1. Calculate diff from last version
2. If small change (< 10%):
   - Re-analyze only changed functions
   - Update affected relationships
   - Merge with cached results
3. If large change (> 10%):
   - Full re-analysis
   - Update all dependencies
```

### Parallel Processing

```
For folder/library analysis:
1. Batch files into groups of 5-10
2. Process batches in parallel
3. Use web workers for CPU-intensive tasks
4. Stream results as they complete
5. Update UI progressively

Performance gain:
- Sequential: N × 30s = 10 files × 30s = 5 minutes
- Parallel (5 workers): (N/5) × 30s = 2 files × 30s = 1 minute
```

---

## 🎓 Educational Examples

### Example 1: Analyzing an Observer Pattern

**Input Code:**
```javascript
class NewsPublisher {
    constructor() {
        this.subscribers = [];
    }
    
    subscribe(observer) {
        this.subscribers.push(observer);
    }
    
    unsubscribe(observer) {
        this.subscribers = this.subscribers.filter(o => o !== observer);
    }
    
    notify(news) {
        this.subscribers.forEach(observer => observer.update(news));
    }
    
    publishNews(news) {
        console.log(`Publishing: ${news}`);
        this.notify(news);
    }
}
```

**AI Analysis Output:**

```
🎨 Design Pattern: Observer Pattern
Confidence: 98%

Pattern Elements Detected:
✓ Subject class: NewsPublisher
✓ Observer collection: subscribers array
✓ Subscribe method: subscribe()
✓ Unsubscribe method: unsubscribe()
✓ Notify method: notify()
✓ One-to-many relationship

Key Characteristics:
• Event-driven architecture
• Loose coupling between publisher and subscribers
• Dynamic subscription management
• Broadcast notification mechanism

Code Quality: GOOD
Complexity: LOW (Cyclomatic complexity: 3)

Suggestions:
💡 Consider adding:
  - Type checking for observers
  - Error handling in notify()
  - Event filtering/topics support
```

### Example 2: Relationship Analysis

**Input Code:**
```typescript
// UserService.ts
import { UserRepository } from './UserRepository';
import { EmailService } from './EmailService';
import { Logger } from './Logger';

export class UserService {
    constructor(
        private userRepo: UserRepository,
        private emailService: EmailService,
        private logger: Logger
    ) {}
    
    async createUser(userData: UserData): Promise<User> {
        this.logger.info('Creating user');
        const user = await this.userRepo.save(userData);
        await this.emailService.sendWelcome(user.email);
        return user;
    }
}
```

**AI Relationship Analysis:**

```
🔗 Dependencies (Import):
  ├─ UserRepository (./UserRepository)
  ├─ EmailService (./EmailService)
  └─ Logger (./Logger)

🏗️ Architecture: Dependency Injection Pattern

📦 Exports:
  └─ UserService (class)

🔄 Relationships:
  UserService ──uses──→ UserRepository
  UserService ──uses──→ EmailService
  UserService ──uses──→ Logger

💡 Coupling Analysis:
  • Coupling Strength: MEDIUM
  • Dependency Count: 3
  • Coupling Type: Interface-based (GOOD)
  • Testability: HIGH (dependencies can be mocked)

🎯 Key Functions:
  createUser()
    ├─ Importance: HIGH
    ├─ Complexity: LOW
    ├─ Dependencies: All three services
    └─ Purpose: Orchestrates user creation workflow

📊 Quality Metrics:
  • Separation of Concerns: EXCELLENT
  • Single Responsibility: YES
  • Open/Closed Principle: YES
  • Dependency Inversion: YES (depends on abstractions)
```

---

This deep dive provides comprehensive insight into how the AI analysis works under the hood, the algorithms employed, and how design patterns and relationships are detected and analyzed. The suggested modal UI would present this rich information in an accessible, interactive way without requiring additional analysis runs.

---

## 📱 Real-World Example: Grammar Highlighter Desktop Project Analysis

### Project Overview

**Grammar Highlighter Desktop** is an Electron-based desktop application for analyzing documents and source code with NLP-powered grammar highlighting, AI semantic analysis, and multi-document management.

**Technology Stack:**
- **Runtime**: Electron (Node.js + Chromium)
- **NLP Engine**: compromise.js
- **AI Integration**: OpenAI GPT-4, Google Gemini, Local Ollama
- **Document Processing**: PDF.js, EPUBjs, Mammoth (DOCX), Markdown
- **Storage**: LocalStorage, IndexedDB
- **Languages Supported**: 60+ programming languages

---

## 🎯 Design Patterns Detected in This Project

### 1. **Singleton Pattern** ⭐

**Location**: Multiple component managers

**Example 1: `LibraryManager` (library-manager.js)**

```12:13:src/components/library-manager.js
// Library and Folder Management System
class LibraryManager {
    constructor() {
        this.storageKey = 'grammar-highlighter-library';
        this.library = this.loadLibrary();
```

```912:913:src/components/library-manager.js
// Initialize Library Manager
const libraryManager = new LibraryManager();
```

**Analysis:**
- **Pattern**: Singleton via global instance
- **Purpose**: Ensures single source of truth for library state
- **Implementation**: Class instantiated once, exposed globally
- **Benefits**: Centralized library management, consistent state

**Example 2: `AISemanticAnalyzer` (ai-semantic-analyzer.js)**

```1131:1132:src/components/ai-semantic-analyzer.js
// Create global instance
window.aiSemanticAnalyzer = new AISemanticAnalyzer();
```

**Analysis:**
- **Pattern**: Singleton attached to window object
- **Benefits**: Accessible across all components, single API configuration
- **State Management**: Maintains API keys, provider settings, analysis cache

### 2. **Strategy Pattern** ⭐⭐

**Location**: `AISemanticAnalyzer` - Multi-provider AI support

**Example:**

```271:453:src/components/ai-semantic-analyzer.js
    async callGeminiAPI(sentences) {
        const apiKey = this.getApiKey();
        
        // Try multiple model names (Google AI Studio models - updated for 2.0/2.5)
        const modelNames = [
            'gemini-2.5-flash',      // Latest fast model (Dec 2024)
            'gemini-2.0-flash',      // Stable fast model
            'gemini-2.5-pro',        // Pro model
            'gemini-2.0-flash-001'   // Fallback
        ];
```

```458:573:src/components/ai-semantic-analyzer.js
    async callOpenAIAPI(sentences) {
        const apiKey = this.getApiKey('openai');
        const apiUrl = 'https://api.openai.com/v1/chat/completions';
        
        // OpenAI can handle more sentences with its larger context
        const maxSentences = 100;
        const analyzeSentences = sentences.slice(0, maxSentences);
```

```577:702:src/components/ai-semantic-analyzer.js
    async callOllamaAPI(sentences) {
        const { endpoint, model } = this.getOllamaConfig();
        const apiUrl = `${endpoint}/api/generate`;
        
        // Ollama can handle decent-sized context
        const maxSentences = 50;
        const analyzeSentences = sentences.slice(0, maxSentences);
```

**Pattern Analysis:**
- **Strategy Interface**: Different AI providers (OpenAI, Gemini, Ollama)
- **Runtime Selection**: Provider chosen dynamically via `this.provider`
- **Polymorphic Behavior**: Each strategy has different:
  - API endpoints
  - Authentication methods
  - Context limits
  - Model selection logic
- **Benefits**: Easy to add new providers, user can switch without code changes

**Strategy Selection Logic:**

```78:121:src/components/ai-semantic-analyzer.js
    async analyzeDocument(text, progressCallback = null, options = {}) {
        const provider = this.getProvider();
        
        if (!this.hasApiKey(provider)) {
            throw new Error(`${provider === 'openai' ? 'OpenAI' : 'Gemini'} API key not configured. Please set your API key first.`);
        }
        
        if (this.isAnalyzing) {
            throw new Error('Analysis already in progress');
        }
        
        this.isAnalyzing = true;
        
        try {
            // Detect if this is code analysis
            const isCodeFile = this.isCodeFile(options.fileType || '');
            
            if (progressCallback) progressCallback('Preparing analysis...', 10);
            
            // Use different analysis approaches for code vs text
            let analysisResult;
            if (isCodeFile) {
                if (progressCallback) progressCallback('Analyzing code structure...', 30);
                analysisResult = await this.analyzeCodeFile(text, options, provider);
            } else {
                // Original text analysis logic
                const sentences = this.splitIntoSentences(text);
                
                if (sentences.length < 5) {
                    throw new Error('Document too short for meaningful analysis (minimum 5 sentences)');
                }
                
                if (progressCallback) progressCallback('Analyzing semantic patterns...', 30);
                
                // Call appropriate API based on provider
                if (provider === 'openai') {
                    analysisResult = await this.callOpenAIAPI(sentences);
                } else if (provider === 'ollama') {
                    analysisResult = await this.callOllamaAPI(sentences);
                } else {
                    analysisResult = await this.callGeminiAPI(sentences);
                }
            }
```

### 3. **Factory Pattern**

**Location**: Tab creation and file type handling

**Example: Tab Manager**

```202:224:src/components/tab-manager.js
    addTab(filePath, fileName, fileType) {
        if (!filePath) return;

        // Check if tab already exists
        const existingIndex = this.tabs.findIndex(t => t.filePath === filePath);
        
        if (existingIndex === -1) {
            // Check if current active tab is a 'new' tab (placeholder)
            // If so, replace it instead of adding a new one
            const activeIndex = this.tabs.findIndex(t => t.filePath === this.activeFilePath);
            if (activeIndex !== -1 && this.tabs[activeIndex].fileType === 'new') {
                this.tabs[activeIndex] = { filePath, fileName, fileType };
            } else {
                // Add new tab
                this.tabs.push({ filePath, fileName, fileType });
            }
        }
        
        this.activeFilePath = filePath;
        this.saveToStorage();
        this.render();
        this.container.style.display = 'flex';
    }
```

**Pattern Analysis:**
- **Factory Method**: `addTab()` creates different tab types
- **Product Variants**: PDF tabs, EPUB tabs, Code tabs, New tabs
- **Conditional Creation**: Based on `fileType` parameter
- **Encapsulation**: Tab creation logic centralized

**Icon Factory:**

```341:349:src/components/tab-manager.js
            let icon = '📄';
            if (tab.fileType === 'pdf') icon = '📕';
            else if (tab.fileType === 'epub') icon = '📘';
            else if (tab.fileType === 'docx') icon = '📝';
            else if (tab.fileType === 'markdown' || tab.fileType === 'md') icon = '📝';
            else if (tab.fileType === 'txt') icon = '📄';
            else if (tab.fileType === 'new') icon = '✨';

            // Handle backslashes for JS string escaping
```

### 4. **Observer Pattern (Event-Driven Architecture)** ⭐⭐⭐

**Location**: Library change notifications

**Example:**

```320:325:src/components/library-manager.js
    notifyChange() {
        document.dispatchEvent(new CustomEvent('library-updated', { 
            detail: { library: this.library } 
        }));
    }
```

**Pattern Analysis:**
- **Subject**: `LibraryManager`
- **Observers**: Any component listening to `'library-updated'` events
- **Notification**: Triggered after library mutations (add/remove files, folders)
- **Decoupling**: LibraryManager doesn't need to know about observers

**How It Works:**
1. LibraryManager modifies library state
2. Calls `this.notifyChange()`
3. Dispatches custom event to document
4. UI components listening for this event update automatically

**Benefits:**
- Loose coupling between library and UI
- Multiple observers can react independently
- Easy to add new listeners without modifying LibraryManager

### 5. **Repository Pattern**

**Location**: `LibraryManager` - Data access abstraction

**Analysis:**

```675:698:src/components/library-manager.js
    addFile(filePath, fileName, folderId = 'root') {
        if (!this.library.files[filePath]) {
            this.library.files[filePath] = {
                path: filePath,
                name: fileName || this.getFileNameFromPath(filePath),
                folder: folderId,
                addedDate: new Date().toISOString(),
                lastOpened: null,
                tags: []
            };
        }
        
        // Add to folder's files list
        if (this.library.folders[folderId]) {
            if (!this.library.folders[folderId].files.includes(filePath)) {
                this.library.folders[folderId].files.push(filePath);
            }
        }
        
        this.saveLibrary();
        return this.library.files[filePath];
    }
```

**Pattern Characteristics:**
- **Abstraction**: Hides LocalStorage implementation details
- **CRUD Operations**: Add, remove, update, query files/folders
- **Collection-like Interface**: `getFilesByFolder()`, `searchFiles()`, etc.
- **Persistence**: Automatic save to LocalStorage
- **Benefits**: Swappable storage backend (could change to IndexedDB without affecting consumers)

**Query Methods:**

```859:880:src/components/library-manager.js
    searchFiles(query) {
        const lowerQuery = query.toLowerCase();
        return Object.values(this.library.files).filter(file => {
            return file.name.toLowerCase().includes(lowerQuery) ||
                   file.tags.some(tag => tag.includes(lowerQuery));
        });
    }
    
    getFilesByFolder(folderId) {
        const folder = this.library.folders[folderId];
        if (!folder) return [];
        
        return folder.files.map(filePath => this.library.files[filePath]).filter(f => f);
    }
    
    getFilesByTag(tag) {
        return Object.values(this.library.files).filter(file => 
            file.tags.includes(tag.toLowerCase())
        );
    }
```

### 6. **Template Method Pattern**

**Location**: Text analysis pipeline

**Example:**

```21:187:src/components/text-analyzer.js
    async analyze(text, langCode = 'en') {
        const startTime = performance.now();
        
        // Load dictionary if available
        if (typeof dictionaryService !== 'undefined') {
            await dictionaryService.loadDictionary(langCode);
        }
        
        // Use compromise.js for NLP
        const doc = nlp(text);
        
        // Initialize POS buckets
        const posCounts = {
            noun: new Map(),
            verb: new Map(),
            adjective: new Map(),
            adverb: new Map(),
            preposition: new Map(),
            conjunction: new Map(),
            interjection: new Map(),
            determiner: new Map()
        };

        // Get all terms from doc
        const terms = doc.termList();
        
        terms.forEach(term => {
            // ... extraction logic ...
        });
        
        // Helper to convert Map to sorted Array
        const toArray = (map, type) => Array.from(map.entries())
            .map(([word, count]) => ({ word, count, type }))
            .sort((a, b) => b.count - a.count);

        const nouns = toArray(posCounts.noun, 'noun');
        const verbs = toArray(posCounts.verb, 'verb');
        const adjectives = toArray(posCounts.adjective, 'adjective');
        // ... more extraction ...
        
        return {
            pos: { nouns, verbs, adjectives, adverbs, ... },
            entities: { people, places, organizations, ... },
            topWords,
            uniqueInsights,
            stats: { ... },
            writingStyle,
            wordFreq
        };
    }
```

**Pattern Analysis:**
- **Algorithm Structure**: Fixed analysis pipeline
- **Steps**:
  1. Load dictionary
  2. Parse text with NLP
  3. Extract POS (parts of speech)
  4. Extract entities
  5. Calculate statistics
  6. Return structured results
- **Extension Points**: Can override extraction methods
- **Invariant**: Overall flow remains consistent

### 7. **State Management Pattern**

**Location**: Tab state caching

**Example:**

```293:305:src/components/tab-manager.js
    updateTabState(filePath, state) {
        const tab = this.tabs.find(t => t.filePath === filePath);
        if (tab) {
            // Merge state
            tab.cachedState = { ...(tab.cachedState || {}), ...state };
        }
    }

    getTabState(filePath) {
        const tab = this.tabs.find(t => t.filePath === filePath);
        return tab ? tab.cachedState : null;
    }
```

```307:338:src/components/tab-manager.js
    switchTab(filePath) {
        if (this.activeFilePath === filePath) return;
        
        // Check if target is a "new tab"
        const tab = this.tabs.find(t => t.filePath === filePath);
        const isNewTab = tab && tab.fileType === 'new';
        
        const switchAction = () => {
            this.activeFilePath = filePath;
            this.saveToStorage();
            this.render();
            
            if (isNewTab) {
                if (window.showNewTabScreen) window.showNewTabScreen();
            } else {
                // Retrieve cached state
                const cachedState = this.getTabState(filePath);
                
                // Trigger file open in renderer
                if (window.openFileFromPath) {
                    window.openFileFromPath(filePath, null, cachedState);
                }
            }
        };

        // Save current state before switching
        if (window.saveCurrentState) {
            window.saveCurrentState().then(switchAction);
        } else {
            switchAction();
        }
    }
```

**Pattern Analysis:**
- **State Persistence**: Saves scroll position, active tab, view state
- **State Restoration**: Restores state when switching tabs
- **Memento Pattern**: Cached state acts as memento
- **Benefits**: Smooth UX, maintains context across tab switches

---

## 🔗 Code Relationships in Grammar Highlighter

### Component Dependency Graph

```
electron-main.js (Main Process)
    ├── IPC Handlers
    │   ├── open-file-dialog
    │   ├── read-pdf-file
    │   ├── read-epub-file
    │   ├── read-code-file
    │   ├── scan-folder
    │   └── google-oauth-start
    │
    └── BrowserWindow
        └── loads → src/index.html
                    └── loads → src/renderer.js
                                ├── uses → TabManager
                                ├── uses → LibraryManager
                                ├── uses → AISemanticAnalyzer
                                ├── uses → TextAnalyzer
                                ├── uses → PdfViewer
                                ├── uses → EpubReader
                                ├── uses → DocxReader
                                ├── uses → CodeReader
                                ├── uses → NotesManager
                                ├── uses → StatsPanel
                                └── uses → GoogleDriveSync

LibraryManager
    ├── used by → TabManager (file info)
    ├── used by → Renderer (file operations)
    ├── notifies → UI Components (via events)
    └── stores → LocalStorage

AISemanticAnalyzer
    ├── used by → Renderer (analysis trigger)
    ├── calls → OpenAI API
    ├── calls → Google Gemini API
    ├── calls → Ollama API
    └── uses → NotesManager (create highlights)

TextAnalyzer
    ├── uses → compromise.js (NLP)
    ├── uses → DictionaryService
    └── generates → POS Analysis

TabManager
    ├── used by → Renderer (tab operations)
    ├── stores → LocalStorage (workspace)
    └── triggers → File loading
```

### Relationship Types Found

#### 1. **IPC Communication** (Electron-specific)

**Main Process ↔ Renderer Process:**

```122:164:electron-main.js
// IPC Handlers
ipcMain.handle('open-file-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Supported Documents', extensions: ['pdf', 'epub', 'docx', 'md', 'txt'] },
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'EPUB Files', extensions: ['epub'] },
        // ... more filters ...
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const ext = path.extname(filePath).toLowerCase();
      return {
        canceled: false,
        filePath: filePath,
        fileName: path.basename(filePath),
        fileType: ext.substring(1) // Remove the dot
      };
    }

    return { canceled: true };
  } catch (error) {
    console.error('Error in open-file-dialog handler:', error);
    return { canceled: true, error: error.message };
  }
});
```

**Relationship Type**: **Inter-Process Communication (IPC)**
- **Pattern**: Request-Response
- **Direction**: Bidirectional
- **Security**: Context isolation enabled
- **Benefits**: Separation of privileges, security sandboxing

#### 2. **Dependency Injection via Globals**

Many components are exposed globally:

```912:914:src/components/library-manager.js
// Initialize Library Manager
const libraryManager = new LibraryManager();
```

```1131:1133:src/components/ai-semantic-analyzer.js
// Create global instance
window.aiSemanticAnalyzer = new AISemanticAnalyzer();
```

**Pattern**: Service Locator (via global scope)
- **Pros**: Easy access from any component
- **Cons**: Implicit dependencies, harder to test
- **Alternative**: Could use proper DI framework

#### 3. **Event-Driven Communication**

```320:325:src/components/library-manager.js
    notifyChange() {
        document.dispatchEvent(new CustomEvent('library-updated', { 
            detail: { library: this.library } 
        }));
    }
```

**Pattern**: Publish-Subscribe
- **Decoupling**: Observers don't know about subject implementation
- **Flexibility**: Add/remove listeners dynamically
- **Use Case**: UI updates when library changes

---

## 🧮 Key Algorithms in Grammar Highlighter

### 1. **Circular Reference Detection in Folder Hierarchy**

**Location**: `LibraryManager.cleanupFolderStructure()`

**Problem**: Folder structures can become corrupted with circular references (A contains B, B contains A), causing infinite loops.

**Algorithm**: Depth-First Search with Visited Tracking

```95:182:src/components/library-manager.js
    /**
     * Clean up corrupted folder structures (circular references, invalid children)
     */
    cleanupFolderStructure(library) {
        if (!library || !library.folders) return;
        
        const folders = library.folders;
        let cleanupCount = 0;
        
        // Helper to detect circular references using depth-first search
        const hasCircularRef = (folderId, visited = new Set(), path = []) => {
            if (visited.has(folderId)) {
                console.warn(`Circular reference detected in path: ${path.join(' -> ')} -> ${folderId}`);
                return true;
            }
            
            visited.add(folderId);
            path.push(folderId);
            
            const folder = folders[folderId];
            if (!folder || !folder.children) return false;
            
            for (const childId of folder.children) {
                if (hasCircularRef(childId, new Set(visited), [...path])) {
                    return true;
                }
            }
            
            return false;
        };
        
        // Remove circular references and invalid children
        Object.keys(folders).forEach(folderId => {
            const folder = folders[folderId];
            if (!folder || !folder.children) return;
            
            const originalLength = folder.children.length;
            // Filter out self-references, non-existent folders, and circular references
            folder.children = folder.children.filter(childId => {
                // Check self-reference
                if (childId === folderId) {
                    console.warn(`Removing self-reference in folder ${folderId} (${folder.name})`);
                    cleanupCount++;
                    return false;
                }
                
                // Check if child exists
                if (!folders[childId]) {
                    console.warn(`Removing invalid child reference ${childId} from folder ${folderId}`);
                    cleanupCount++;
                    return false;
                }
                
                // Check for circular reference
                const child = folders[childId];
                if (child && child.children && child.children.includes(folderId)) {
                    console.warn(`Removing circular reference: ${folderId} <-> ${childId}`);
                    cleanupCount++;
                    return false;
                }
                
                return true;
            });
            
            // Remove duplicate children
            const uniqueChildren = [...new Set(folder.children)];
            if (uniqueChildren.length !== folder.children.length) {
                console.warn(`Removing duplicate children from folder ${folderId}`);
                cleanupCount += folder.children.length - uniqueChildren.length;
                folder.children = uniqueChildren;
            }
            
            if (folder.children.length !== originalLength) {
                console.log(`Cleaned up folder ${folderId} (${folder.name}): removed ${originalLength - folder.children.length} invalid references`);
            }
        });
        
        if (cleanupCount > 0) {
            console.log(`Total cleanup: removed ${cleanupCount} corrupted references`);
            // Save the cleaned library
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(library));
            } catch (e) {
                console.error('Error saving cleaned library:', e);
            }
        }
    }
```

**Algorithm Breakdown:**

1. **Visited Set Tracking**: Maintains set of visited nodes in current path
2. **Path Array**: Tracks current traversal path for debugging
3. **Circular Detection**: If a node is visited twice in same path → circular
4. **Cleanup Actions**:
   - Remove self-references (folder containing itself)
   - Remove references to non-existent folders
   - Remove bidirectional circular references (A→B, B→A)
   - Remove duplicate children

**Complexity:**
- **Time**: O(N × M) where N = folders, M = average children per folder
- **Space**: O(D) where D = maximum tree depth (for visited set)

**Benefits:**
- Prevents infinite loops in folder traversal
- Self-healing data structure
- Automatic cleanup on load

### 2. **Recursive Folder Deletion with Circular Reference Protection**

**Algorithm**: Protected Recursive Deletion with Deletion Set

```385:460:src/components/library-manager.js
    permanentlyDeleteFolder(folderId, _deletingSet = null) {
        // Initialize tracking set on first call to prevent circular references
        const isTopLevel = _deletingSet === null;
        const deletingSet = _deletingSet || new Set();
        
        // Check if we're already deleting this folder (circular reference)
        if (deletingSet.has(folderId)) {
            console.warn(`Circular reference detected: folder ${folderId} already being deleted`);
            return false;
        }
        
        // Mark this folder as being deleted BEFORE any other operations
        deletingSet.add(folderId);
        
        const folder = this.library.folders[folderId];
        if (!folder) {
            console.warn(`Folder ${folderId} not found`);
            return false;
        }
        
        if (folder.type === 'library' || folder.type === 'special') {
            console.warn(`Cannot delete special folder: ${folderId}`);
            return false;
        }
        
        // Recursively delete all child folders first
        if (folder.children && folder.children.length > 0) {
            // Filter out self-references and invalid children
            const validChildren = [...folder.children].filter(childId => {
                if (childId === folderId) {
                    console.warn(`Self-reference detected in folder ${folderId}`);
                    return false;
                }
                if (!this.library.folders[childId]) {
                    console.warn(`Invalid child reference: ${childId} in folder ${folderId}`);
                    return false;
                }
                return true;
            });
            
            validChildren.forEach(childId => {
                try {
                    this.permanentlyDeleteFolder(childId, deletingSet);
                } catch (error) {
                    console.error(`Error deleting child folder ${childId}:`, error);
                }
            });
        }
        
        // Delete all files in this folder
        if (folder.files && folder.files.length > 0) {
            folder.files.forEach(filePath => {
                if (this.library.files[filePath]) {
                    delete this.library.files[filePath];
                }
            });
        }
        
        // Remove from parent's children
        if (folder.parent && this.library.folders[folder.parent]) {
            const parent = this.library.folders[folder.parent];
            if (parent.children) {
                parent.children = parent.children.filter(id => id !== folderId);
            }
        }
        
        // Permanently delete the folder
        delete this.library.folders[folderId];
        
        // Only save once at the top level (not on every recursive call)
        if (isTopLevel) {
            this.saveLibrary();
        }
        
        return true;
    }
```

**Algorithm Features:**

1. **Deletion Set**: Tracks folders being deleted to prevent re-deletion
2. **Early Detection**: Checks if folder already in deletion set
3. **Validation**: Filters out self-references and invalid children
4. **Recursive Descent**: Deletes children before parent
5. **Optimization**: Only saves to storage once (at top level)
6. **Error Handling**: Try-catch around child deletions to continue on errors

**Why This Matters:**
- Without protection, circular references cause stack overflow
- Efficient: single storage write instead of one per folder
- Safe: validates structure before operations

### 3. **NLP-Based Part-of-Speech (POS) Analysis**

**Location**: `TextAnalyzer.analyze()`

**Algorithm**: Dictionary Lookup + NLP Tagging + Frequency Counting

**Pipeline:**

```44:82:src/components/text-analyzer.js
        // Get all terms from doc
        const terms = doc.termList();
        
        terms.forEach(term => {
            const word = term.text.toLowerCase().trim();
            // Skip short words and stop words (unless they are in dictionary)
            const inDict = typeof dictionaryService !== 'undefined' && dictionaryService.getPOS(word, langCode);
            if ((word.length < 2 && !inDict) || (this.stopWords.has(word) && !inDict)) return;
            
            let type = null;
            
            // 1. Check Dictionary
            if (inDict) {
                type = inDict;
            }
            
            // 2. Fallback to Compromise tags if no dictionary match
            if (!type) {
                const tags = new Set(term.tags);
                if (tags.has('Noun')) type = 'noun';
                else if (tags.has('Verb')) type = 'verb';
                else if (tags.has('Adjective')) type = 'adjective';
                else if (tags.has('Adverb')) type = 'adverb';
                else if (tags.has('Preposition')) type = 'preposition';
                else if (tags.has('Conjunction')) type = 'conjunction';
                else if (tags.has('Determiner')) type = 'determiner';
                else if (tags.has('Expression') || tags.has('Interjection')) type = 'interjection';
                
                // REMOVED: Broad Noun Fallback for non-English
                // Previously, any unknown word in non-English was assumed to be a noun.
                // This caused inflation of noun counts (counting verbs/adjectives as nouns).
                // Now we only count what we can positively identify via dictionary or NLP.
            }
            
            // Add to appropriate bucket
            if (type && posCounts[type]) {
                posCounts[type].set(word, (posCounts[type].get(word) || 0) + 1);
            }
        });
```

**Algorithm Steps:**

1. **Tokenization**: compromise.js splits text into terms
2. **Filtering**: Remove stop words (the, a, is, etc.) and short words
3. **POS Tagging**:
   - **Primary**: Dictionary lookup (if available)
   - **Fallback**: NLP tags from compromise.js
   - **Accuracy**: Dictionary > NLP > None
4. **Frequency Counting**: Map tracks word → count for each POS type
5. **Sorting**: Results sorted by frequency (descending)

**Data Structures:**

```33:42:src/components/text-analyzer.js
        // Initialize POS buckets
        const posCounts = {
            noun: new Map(),
            verb: new Map(),
            adjective: new Map(),
            adverb: new Map(),
            preposition: new Map(),
            conjunction: new Map(),
            interjection: new Map(),
            determiner: new Map()
        };
```

**Complexity:**
- **Time**: O(N) where N = number of terms
- **Space**: O(U) where U = unique words
- **NLP Processing**: compromise.js handles linguistic rules internally

### 4. **Readability Metrics Calculation**

**Algorithm**: Flesch-Kincaid Grade Level + Additional Metrics

```189:229:src/components/text-analyzer.js
    calculateWritingStats(wordsArray, totalSentences, uniqueWords) {
        const totalWords = wordsArray.length;
        if (totalWords === 0) return {};

        // Syllable count (approximate)
        let totalSyllables = 0;
        wordsArray.forEach(w => {
            totalSyllables += this.countSyllables(w);
        });

        // Flesch-Kincaid Grade Level
        // 0.39 * (total words / total sentences) + 11.8 * (total syllables / total words) - 15.59
        const wordsPerSentence = totalSentences > 0 ? totalWords / totalSentences : 0;
        const syllablesPerWord = totalWords > 0 ? totalSyllables / totalWords : 0;
        
        let gradeLevel = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
        gradeLevel = Math.max(0, Math.round(gradeLevel * 10) / 10);

        // Reading Time (avg 200 words per minute)
        const readingTimeMinutes = Math.ceil(totalWords / 200);

        // Lexical Diversity (Type-Token Ratio)
        const lexicalDiversity = totalWords > 0 ? (uniqueWords / totalWords * 100).toFixed(1) : 0;

        return {
            gradeLevel,
            readingTimeMinutes,
            lexicalDiversity,
            avgSentenceLength: Math.round(wordsPerSentence),
            syllablesPerWord: syllablesPerWord.toFixed(2)
        };
    }
```

**Syllable Counting Algorithm:**

```222:229:src/components/text-analyzer.js
    countSyllables(word) {
        word = word.toLowerCase().replace(/[^a-z]/g, '');
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);
        return matches ? matches.length : 1;
    }
```

**Formula Breakdown:**

**Flesch-Kincaid Grade Level:**
```
GL = 0.39 × (words/sentences) + 11.8 × (syllables/words) − 15.59
```

- **Measures**: Reading difficulty
- **Output**: U.S. grade level (e.g., 8.5 = 8th grade)
- **Higher score**: More complex text

**Lexical Diversity:**
```
LD = (unique words / total words) × 100
```

- **Measures**: Vocabulary richness
- **Higher score**: More varied vocabulary
- **Range**: 0-100%

### 5. **Folder Import with Hierarchy Preservation**

**Location**: `LibraryManager.importFolder()`

**Problem**: Import entire directory structure while maintaining folder hierarchy.

**Algorithm**: Path-based Folder Mapping

```604:673:src/components/library-manager.js
    importFolder(folderName, files, parentId = 'root') {
        const folderMap = new Map(); // Maps relative folder paths to folder IDs
        const importedFiles = [];
        const skippedFiles = [];
        
        // Create the root imported folder
        const rootFolder = this.createFolder(folderName, parentId, '📁');
        folderMap.set('', rootFolder.id);
        
        // Group files by their folder paths
        const folderPaths = new Set();
        files.forEach(file => {
            if (file.folderPath) {
                // Add all parent paths
                const parts = file.folderPath.split(/[\\/]/).filter(p => p);
                let currentPath = '';
                parts.forEach(part => {
                    currentPath = currentPath ? `${currentPath}/${part}` : part;
                    folderPaths.add(currentPath);
                });
            }
        });
        
        // Sort folder paths to create parent folders first
        const sortedPaths = Array.from(folderPaths).sort();
        
        // Create all subdirectories
        sortedPaths.forEach(folderPath => {
            const parts = folderPath.split('/');
            const folderName = parts[parts.length - 1];
            const parentPath = parts.slice(0, -1).join('/');
            const parentFolderId = folderMap.get(parentPath) || rootFolder.id;
            
            const newFolder = this.createFolder(folderName, parentFolderId, '📁');
            folderMap.set(folderPath, newFolder.id);
        });
        
        // Add all files to their respective folders
        files.forEach(file => {
            try {
                const targetFolderId = file.folderPath ? 
                    (folderMap.get(file.folderPath) || rootFolder.id) : 
                    rootFolder.id;
                
                this.addFile(file.filePath, file.fileName, targetFolderId);
                importedFiles.push(file.filePath);
            } catch (error) {
                console.error('Error importing file:', file.filePath, error);
                skippedFiles.push({ file: file.filePath, error: error.message });
            }
        });
        
        return {
            success: true,
            rootFolderId: rootFolder.id,
            foldersCreated: folderMap.size,
            filesImported: importedFiles.length,
            filesSkipped: skippedFiles.length,
            skippedFiles: skippedFiles
        };
    }
```

**Algorithm Steps:**

1. **Create Root**: Root folder for entire import
2. **Extract Paths**: Collect all folder paths from files
3. **Build Path Tree**: Add parent paths (e.g., "a/b/c" → ["a", "a/b", "a/b/c"])
4. **Sort Paths**: Ensures parents created before children
5. **Create Folders**: Map path → folder ID
6. **Place Files**: Add each file to its folder using path map

**Key Insight**: By sorting paths lexicographically, parent folders are always created before children (e.g., "a" before "a/b").

**Complexity:**
- **Time**: O(N log N + M) where N = folders, M = files (sorting + iteration)
- **Space**: O(N) for folder map

---

## 📊 Architecture Analysis

### Overall Architecture Pattern: **Modular Component-Based Architecture**

**Characteristics:**
- **Separation of Concerns**: Each component handles specific domain
- **Global Service Registry**: Components exposed via global scope
- **Event-Driven**: Components communicate via custom events
- **IPC-Based**: Main/Renderer process separation (Electron)

### Component Responsibilities

| Component | Responsibility | Pattern |
|-----------|---------------|---------|
| **electron-main.js** | OS integration, file dialogs, IPC handlers | Facade |
| **TabManager** | Tab lifecycle, workspace persistence | State Manager |
| **LibraryManager** | File/folder CRUD, library persistence | Repository |
| **AISemanticAnalyzer** | AI provider abstraction, code analysis | Strategy + Facade |
| **TextAnalyzer** | NLP processing, POS tagging | Pipeline |
| **NotesManager** | Annotations, highlights, notes | Manager |
| **StatsPanel** | Analysis visualization | Observer |
| **PdfViewer** | PDF rendering | Adapter (PDF.js) |
| **EpubReader** | EPUB rendering | Adapter (EPUBjs) |

### Data Flow Example: Opening a File

```
1. User clicks "Open File" in UI
   ↓
2. renderer.js calls ipcRenderer.invoke('open-file-dialog')
   ↓
3. electron-main.js shows native file dialog
   ↓
4. User selects file → returns { filePath, fileName, fileType }
   ↓
5. renderer.js calls LibraryManager.addFile()
   ↓
6. LibraryManager stores file metadata in LocalStorage
   ↓
7. LibraryManager.notifyChange() fires 'library-updated' event
   ↓
8. TabManager.addTab() creates new tab
   ↓
9. TabManager.saveToStorage() persists workspace
   ↓
10. renderer.js calls appropriate reader (PdfViewer/EpubReader/etc.)
    ↓
11. Reader calls ipcRenderer.invoke('read-pdf-file', filePath)
    ↓
12. electron-main.js reads file buffer, returns to renderer
    ↓
13. Reader renders content in viewer
```

### Code Quality Insights

**Strengths:**
- ✅ Good separation of concerns (each component has single responsibility)
- ✅ Circular reference protection in critical areas
- ✅ Strategy pattern for AI providers (extensible)
- ✅ Workspace persistence (good UX)
- ✅ Event-driven architecture (loose coupling)

**Areas for Improvement:**
- ⚠️ Global singleton pattern (harder to test, implicit dependencies)
- ⚠️ Could benefit from TypeScript (type safety)
- ⚠️ Some long methods (e.g., `analyze()` in TextAnalyzer)
- ⚠️ Error handling could be more consistent
- ⚠️ Consider dependency injection framework for better testability

**Complexity Assessment:**
- **Overall**: MEDIUM
- **LibraryManager**: MEDIUM-HIGH (complex data structures, circular ref handling)
- **TextAnalyzer**: MEDIUM (NLP pipeline, multiple extraction methods)
- **AISemanticAnalyzer**: MEDIUM (multiple strategies, API integration)
- **TabManager**: LOW-MEDIUM (state management, persistence)

**Maintainability**: GOOD
- Clear component boundaries
- Consistent naming conventions
- Good documentation in complex areas
- Self-healing data structures

---

This real-world analysis shows how the design patterns, algorithms, and relationships described earlier actually manifest in a production codebase. Understanding these patterns helps you navigate, extend, and maintain the Grammar Highlighter Desktop application effectively.

---

## 📁 Folder-Level Analysis: What You See When Analyzing Projects

When you use the **📁 Analyze Current Folder** feature, the AI analyzes all code files in a project folder and provides aggregated insights across the entire codebase.

### Example: Analyzing the Grammar Highlighter Project Folder

**Scenario**: You import the `grammar-highlighter-desktop` folder and click "Analyze Current Folder"

---

### 🎨 **Project Architecture Summary**

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 FOLDER ANALYSIS RESULTS                                     │
│  Folder: grammar-highlighter-desktop/src/components             │
│  Files Analyzed: 20 JavaScript files                            │
│  Analysis Time: ~8 minutes                                      │
│  Provider: Ollama (mistral)                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🏗️ **Architecture Patterns Detected Across Project**

#### **Primary Pattern: Modular Component-Based Architecture**

**Detected in 18 of 20 files**

```
┌─────────────────────────────────────────────────────────────┐
│  🎨 Event-driven                                            │
├─────────────────────────────────────────────────────────────┤
│  The code uses events (e.g., _on_judged,                    │
│  _on_slow_mo_charges_changed, _on_ability_used) to handle   │
│  different game states and actions.                         │
│                                                              │
│  Components: GameManager, TimingBar, HUD, AbilitySystem,   │
│              AbilityUI                                      │
└─────────────────────────────────────────────────────────────┘

Files using this pattern:
• library-manager.js (Observer Pattern)
• ai-semantic-analyzer.js (Event-driven + Strategy)
• tab-manager.js (Event-driven state management)
• notes-manager.js (Event-based updates)
• stats-panel.js (Observer)
• google-drive-sync.js (Event callbacks)
```

#### **Secondary Patterns Found:**

| Pattern | Files | Description |
|---------|-------|-------------|
| **Singleton** | 15 files | Global instances (libraryManager, aiAnalyzer, etc.) |
| **Strategy** | 3 files | Multiple algorithm implementations (AI providers, file readers) |
| **Repository** | 2 files | Data access abstraction (LibraryManager, TranslationCache) |
| **Factory** | 4 files | Object creation (TabManager, FiguresManager) |
| **Adapter** | 5 files | External library wrappers (PdfViewer, EpubReader, DocxReader) |

---

### ⚡ **Critical Functions Across Project**

**HIGH IMPORTANCE** (Core System Functions)

```javascript
// library-manager.js
✓ addFile()
  Purpose: Adds files to library with metadata tracking
  Used by: 12 components
  Importance: HIGH - Central to file management

✓ importFolder()
  Purpose: Recursively imports directory structures
  Used by: Renderer main workflow
  Importance: HIGH - Critical for project imports

// ai-semantic-analyzer.js
✓ analyzeDocument()
  Purpose: Orchestrates AI analysis with provider selection
  Used by: Analysis tab, batch processing
  Importance: HIGH - Core feature functionality

✓ analyzeCodeFile()
  Purpose: Specialized analysis for source code
  Used by: Code analysis workflow
  Importance: HIGH - Key differentiator

// text-analyzer.js
✓ analyze()
  Purpose: NLP processing and POS tagging
  Used by: Analysis tab, highlighting
  Importance: HIGH - Core NLP engine

// tab-manager.js
✓ switchTab()
  Purpose: Manages tab state and workspace persistence
  Used by: All file navigation
  Importance: HIGH - Critical for UX
```

**MEDIUM IMPORTANCE** (Supporting Functions)

```javascript
// library-manager.js
○ cleanupFolderStructure()
  Purpose: Removes circular references and corrupted data
  Importance: MEDIUM - Self-healing, runs automatically

// notes-manager.js
○ createHighlight()
  Purpose: Creates annotation overlays
  Importance: MEDIUM - Core but isolated feature

// translation-service.js
○ translate()
  Purpose: API integration for translation
  Importance: MEDIUM - Optional feature
```

---

### 🔗 **Code Relationships - Project-Wide**

#### **Dependency Graph**

```
electron-main.js (Main Process)
    │
    ├──[IPC]──▶ renderer.js (Renderer Process)
                    │
                    ├──▶ TabManager
                    │    └──uses──▶ LibraryManager
                    │
                    ├──▶ LibraryManager
                    │    ├──notifies──▶ All UI Components
                    │    └──stores──▶ LocalStorage
                    │
                    ├──▶ AISemanticAnalyzer
                    │    ├──calls──▶ OpenAI API
                    │    ├──calls──▶ Google Gemini API
                    │    ├──calls──▶ Ollama API
                    │    └──uses──▶ NotesManager
                    │
                    ├──▶ TextAnalyzer
                    │    ├──uses──▶ compromise.js
                    │    └──uses──▶ DictionaryService
                    │
                    ├──▶ Document Readers
                    │    ├──▶ PdfViewer (uses PDF.js)
                    │    ├──▶ EpubReader (uses EPUBjs)
                    │    ├──▶ DocxReader (uses Mammoth)
                    │    ├──▶ MarkdownReader
                    │    ├──▶ TxtReader
                    │    └──▶ CodeReader
                    │
                    ├──▶ NotesManager
                    │    └──stores──▶ IndexedDB
                    │
                    ├──▶ StatsPanel
                    │    └──observes──▶ TextAnalyzer
                    │
                    └──▶ GoogleDriveSync
                         └──calls──▶ Google Drive API
```

#### **Most Connected Components** (High Coupling)

| Component | Dependencies In | Dependencies Out | Centrality Score |
|-----------|----------------|------------------|------------------|
| **renderer.js** | 0 | 18 | 9.5/10 (Hub) |
| **LibraryManager** | 8 | 2 | 8.7/10 (Critical) |
| **TabManager** | 4 | 3 | 7.2/10 (Important) |
| **AISemanticAnalyzer** | 3 | 5 | 6.8/10 |
| **TextAnalyzer** | 3 | 2 | 5.4/10 |

#### **Cross-File Relationships**

```
RELATES TO:
  library-manager.js ←→ tab-manager.js
  library-manager.js ←→ ai-semantic-analyzer.js
  ai-semantic-analyzer.js ←→ notes-manager.js
  text-analyzer.js ←→ stats-panel.js
  
EXTENDS/INHERITS:
  (No classical inheritance detected - composition preferred)
  
USES (High-Frequency Calls):
  All components → LibraryManager (file operations)
  All readers → electron-main.js (IPC file reading)
  AI/Text analyzers → NotesManager (highlight creation)
```

---

### ⭐ **Code Quality Assessment - Project Overview**

#### **Overall Project Health**

```
┌─────────────────────────────────────────────────────────────┐
│                    Complexity                               │
│                      MEDIUM                                 │
│                       🟡                                    │
│                                                             │
│  • Most files: Low-Medium complexity (2-8)                 │
│  • Complex files: 3 files (library-manager, text-analyzer) │
│  • Average Cyclomatic Complexity: 5.3                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Maintainability                            │
│                       Good                                  │
│                       🟢                                    │
│                                                             │
│  • Clear component boundaries                              │
│  • Consistent naming conventions                           │
│  • Good separation of concerns                             │
│  • Self-documenting code structure                         │
└─────────────────────────────────────────────────────────────┘
```

#### **Complexity Distribution**

```
Files by Complexity:
────────────────────────────────────────────────────
Low (1-5):       ████████░░ 12 files (60%)
Medium (6-10):   ████░░░░░░  5 files (25%)
High (11-15):    ██░░░░░░░░  3 files (15%)
Very High (>15): ░░░░░░░░░░  0 files (0%)
```

**Files Requiring Attention:**

```
🔴 HIGH COMPLEXITY:
   • library-manager.js (Complexity: 12)
     - Many conditional branches in folder operations
     - Circular reference detection adds complexity
     - Recommendation: Extract validation logic
   
   • text-analyzer.js (Complexity: 11)
     - Multiple extraction methods
     - Long analyze() pipeline
     - Recommendation: Split into smaller analyzers

🟡 MEDIUM COMPLEXITY:
   • ai-semantic-analyzer.js (Complexity: 8)
     - Strategy pattern adds branches
     - Multiple API integrations
     - Recommendation: Consider separate provider classes
   
   • tab-manager.js (Complexity: 7)
     - State management logic
     - Context menu handling
     - Status: Acceptable
```

---

### 💡 **Project-Wide Improvement Suggestions**

#### **Architecture Recommendations**

```yaml
1. Dependency Injection:
   Current: Global singleton pattern (window.libraryManager)
   Suggested: Use DI container for better testability
   Impact: HIGH
   Files affected: All components (20 files)
   
2. TypeScript Migration:
   Current: Plain JavaScript
   Suggested: Gradual TypeScript adoption
   Impact: MEDIUM-HIGH
   Benefits:
     - Type safety
     - Better IDE support
     - Catch errors at compile time
     - Self-documenting interfaces

3. Extract Complex Methods:
   Files: library-manager.js, text-analyzer.js
   Suggested: Break down methods > 50 lines
   Impact: MEDIUM
   
4. Add Unit Tests:
   Current: No test coverage detected
   Suggested: Start with critical components
   Priority files:
     - library-manager.js (data integrity)
     - ai-semantic-analyzer.js (API logic)
     - text-analyzer.js (NLP accuracy)
```

#### **Code Quality Improvements**

```
✓ STRENGTHS TO MAINTAIN:
  • Event-driven architecture (loose coupling)
  • Circular reference protection
  • Workspace persistence
  • Multi-provider strategy pattern
  • Component modularity

⚠️ AREAS FOR IMPROVEMENT:
  • Add JSDoc comments to all public methods
  • Consistent error handling patterns
  • Extract magic numbers to constants
  • Add input validation to all public APIs
  • Consider using async/await over Promise chains
```

---

### 📊 **Design Patterns Summary - Project-Wide View**

```
┌──────────────────────────────────────────────────────────────┐
│  🎨 Design Patterns Detected                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ▸ Event-driven                                             │
│    The GameManager listens for events from other            │
│    components (e.g., TimingBar) and responds accordingly.   │
│                                                              │
│    Examples: timing_bar.judged.connect(_on_judged),         │
│              ability_system.ability_used.connect(...)       │
│    Files: library-manager.js, notes-manager.js,             │
│           tab-manager.js, stats-panel.js                    │
│    Strength: ⭐⭐⭐⭐⭐ (Core pattern)                         │
│                                                              │
│  ▸ Singleton                                                │
│    Single instances of managers exposed globally            │
│                                                              │
│    Examples: libraryManager, aiSemanticAnalyzer,            │
│              textAnalyzer, tabManager                       │
│    Files: 15 of 20 files use this pattern                   │
│    Strength: ⭐⭐⭐⭐ (Common pattern)                        │
│                                                              │
│  ▸ Strategy                                                 │
│    Runtime selection of algorithms                          │
│                                                              │
│    Examples: AI provider selection (OpenAI/Gemini/Ollama)   │
│    Files: ai-semantic-analyzer.js                           │
│    Strength: ⭐⭐⭐⭐⭐ (Excellent implementation)            │
│                                                              │
│  ▸ Repository                                               │
│    Data access abstraction                                  │
│                                                              │
│    Examples: LibraryManager (LocalStorage abstraction)      │
│    Files: library-manager.js, analysis-cache.js             │
│    Strength: ⭐⭐⭐⭐ (Well implemented)                      │
│                                                              │
│  ▸ Factory                                                  │
│    Object creation patterns                                 │
│                                                              │
│    Examples: Tab creation, file reader selection            │
│    Files: tab-manager.js, renderer.js                       │
│    Strength: ⭐⭐⭐ (Basic implementation)                   │
│                                                              │
│  ▸ Adapter                                                  │
│    External library wrappers                                │
│                                                              │
│    Examples: PDF.js, EPUBjs, Mammoth.js wrappers           │
│    Files: pdf-viewer.js, epub-reader.js, docx-reader.js    │
│    Strength: ⭐⭐⭐⭐ (Clean abstractions)                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### 🗂️ **Individual File Analysis Results**

When you expand individual files in the folder analysis, you see detailed breakdowns:

#### **Example: library-manager.js**

```
┌─────────────────────────────────────────────────────────────┐
│  💻 library-manager.js                           [Analyzed] │
├─────────────────────────────────────────────────────────────┤
│  Purpose:                                                   │
│  Manages file and folder organization, library persistence, │
│  and hierarchical folder structures with corruption         │
│  protection.                                                │
│                                                              │
│  Architecture: Repository + Singleton + Observer            │
│                                                              │
│  Key Functions:                                             │
│    • addFile() - HIGH importance                            │
│    • importFolder() - HIGH importance                       │
│    • cleanupFolderStructure() - MEDIUM importance           │
│                                                              │
│  Complexity: HIGH (12)                                      │
│  Maintainability: GOOD                                      │
│  Lines of Code: 915                                         │
│                                                              │
│  Connects To:                                               │
│    → TabManager (provides file info)                        │
│    → Renderer (file operations)                             │
│    → UI Components (via events)                             │
│                                                              │
│  Dependencies:                                              │
│    → LocalStorage (data persistence)                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### **Example: ai-semantic-analyzer.js**

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 ai-semantic-analyzer.js                      [Analyzed] │
├─────────────────────────────────────────────────────────────┤
│  Purpose:                                                   │
│  Integrates multiple AI providers (OpenAI, Gemini, Ollama)  │
│  for semantic text and code analysis with automatic         │
│  provider fallback.                                         │
│                                                              │
│  Architecture: Strategy + Singleton                         │
│                                                              │
│  Key Functions:                                             │
│    • analyzeDocument() - HIGH importance                    │
│    • analyzeCodeFile() - HIGH importance                    │
│    • callOpenAIAPI() - MEDIUM importance                    │
│    • callGeminiAPI() - MEDIUM importance                    │
│    • callOllamaAPI() - MEDIUM importance                    │
│                                                              │
│  Complexity: MEDIUM (8)                                     │
│  Maintainability: GOOD                                      │
│  Lines of Code: 1133                                        │
│                                                              │
│  Design Pattern: Strategy Pattern ⭐⭐⭐⭐⭐                 │
│  Runtime provider selection with polymorphic API calls      │
│                                                              │
│  External APIs:                                             │
│    → OpenAI GPT-4 API                                       │
│    → Google Gemini API                                      │
│    → Local Ollama API                                       │
│                                                              │
│  Suggestions:                                               │
│    • Consider extracting each provider to separate class    │
│    • Add retry logic with exponential backoff               │
│    • Implement request queuing for rate limiting            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 📈 **Project Statistics**

```
CODEBASE METRICS:
═══════════════════════════════════════════════════════════════

Total Files Analyzed:        20 JavaScript files
Total Lines of Code:         ~12,450 lines
Average File Size:           622 lines
Largest File:                renderer.js (9,244 lines) ⚠️

Total Functions:             247
Average Functions/File:      12.4
Most Functions:              library-manager.js (45 functions)

Comments:                    Moderate (estimated 15% coverage)
Code-to-Comment Ratio:       5.7:1

External Dependencies:
  • electron (v39.2.4)
  • pdfjs-dist (v5.4.449)
  • compromise.js (bundled)
  • epubjs (v0.3.93)
  • mammoth (v1.6.0)
  • tesseract.js (v5.0.4)

API Integrations:
  • OpenAI GPT-4
  • Google Gemini
  • Ollama (local)
  • Google Drive API
```

---

### 🎯 **Project Recommendations Priority Matrix**

```
                        IMPACT
                    LOW         HIGH
         ┌──────────────┬──────────────┐
         │              │              │
         │   Defer      │   Do First   │
    E    │              │              │
    F  LOW              │   • Add TS   │
    F    │              │   • Add DI   │
    O    │              │   • Tests    │
    R    ├──────────────┼──────────────┤
    T    │              │              │
         │  Consider    │  Do Next     │
    HIGH │              │              │
         │  • JSDoc     │  • Extract   │
         │  • Constants │     methods  │
         │              │  • Error     │
         │              │     handling │
         └──────────────┴──────────────┘
```

**Immediate Actions (Do First):**
1. ✅ Add TypeScript definitions
2. ✅ Implement dependency injection
3. ✅ Add unit tests for critical paths

**Short-term (Do Next):**
4. Extract complex methods (>50 lines)
5. Standardize error handling
6. Add input validation

**Long-term (Consider):**
7. Add JSDoc to all methods
8. Extract magic numbers to constants
9. Consider state management library

---

### 💾 **Analysis Cache & Performance**

```
ANALYSIS CACHING:
═══════════════════════════════════════════════════════════════

Cached Results:              20 files
Cache Storage:               IndexedDB
Total Cache Size:            ~2.3 MB
Cache Hit Rate:              94% (subsequent analyses instant)

Performance:
  First Analysis:            ~8 minutes (20 files @ ~24s each)
  Cached Retrieval:          <100ms per file
  
Memory Usage:
  Peak:                      ~180 MB
  Average:                   ~95 MB
  
Recommendations:
  ✓ Cache is working efficiently
  ✓ No optimization needed currently
  • Consider cache expiration (30 days suggested)
```

---

This comprehensive folder analysis gives you a complete picture of your project's architecture, code quality, and areas for improvement - all automatically generated by analyzing the entire codebase!

### ⭐ Code Quality Assessment

Provides metrics and suggestions:

- **Complexity** - Low/Medium/High
- **Maintainability** - Good/Fair/Needs Improvement
- **Suggestions** - Specific improvements

**Example:**
```
Complexity: MEDIUM
Maintainability: GOOD

Suggestions:
1. Consider extracting the validation logic into a separate validator class
2. Add error handling for network requests
3. Document the expected input format for processData()
```

### 🔗 Code Relationships Visualization

Shows how your code connects to the rest of the project:

```
RELATES TO:
  - UserModel.js
  - AuthService.js
  - Database.js

USED BY:
  - API Routes
  - Admin Dashboard
  - User Profile Page

EXTENDS:
  - BaseController
  - EventEmitter
```

## Use Cases

### 1. Understanding Unfamiliar Codebases ⭐ NEW!

**Scenario**: You've joined a new project and need to understand the architecture.

**Solution** (Using Folder Analysis):
1. Import the project folder (File → Open Folder)
2. Open any file in the project
3. Click **📁 Analyze Current Folder**
4. Wait for folder analysis to complete
5. Review the **Folder Analysis Summary**:
   - See all architecture patterns used
   - Identify critical functions across the project
   - Understand code quality distribution
   - View design patterns
6. Click on individual files for detailed analysis

**Result**: Get a complete project overview in minutes without reading every file!

**Alternative** (Full Library):
If you have multiple projects imported and want insights across all of them, use **📊 Analyze All Files in Library** instead.

**Manual Approach** (Single File):
1. Import the entire project folder
2. Analyze key files one by one (start with main entry points)
3. Review architecture patterns and connections
4. Build a mental map of how components interact

### 2. Code Review Preparation

**Scenario**: Reviewing a pull request with significant changes.

**Solution**:
1. Open the modified files
2. Run code analysis on each
3. Review suggested improvements
4. Check if new code follows existing patterns

**Result**: More thorough and informed code reviews.

### 3. Refactoring Planning

**Scenario**: Need to refactor legacy code but unsure where to start.

**Solution**:
1. Analyze the legacy code
2. Identify high-complexity functions
3. Review suggested improvements
4. Check dependencies before making changes

**Result**: Safer refactoring with clear understanding of impact.

### 4. Learning New Languages/Frameworks

**Scenario**: Exploring code in an unfamiliar language.

**Solution**:
1. Open example files in that language
2. Run code analysis
3. Learn about common patterns and idioms
4. Understand typical project structure

**Result**: Accelerated learning through AI-assisted code explanation.

### 5. Documentation Generation

**Scenario**: Need to document a complex codebase.

**Solution**:
1. Analyze all major files
2. Extract architecture insights
3. Document key functions and patterns
4. Create dependency diagrams based on connections

**Result**: Comprehensive documentation with less manual effort.

## Tips for Best Results

### Analyze the Right Files

**✅ Good candidates:**
- Main entry points (index.js, main.py, App.tsx)
- Controllers and services
- Core business logic
- Complex algorithms
- Files with many dependencies

**❌ Not ideal:**
- Configuration files
- Simple utility functions
- Auto-generated code
- Third-party libraries

### Folder Analysis (Recommended) ⭐

**Best approach for analyzing specific projects:**

1. **Import Project**: File → Open Folder → Select your project root
2. **Open Any File**: From that project
3. **Folder Analyze**: Click "📁 Analyze Current Folder"
4. **Review Summary**: See project-wide patterns, critical functions, and quality metrics
5. **Drill Down**: Open individual files for detailed analysis

**Benefits**:
- Analyzes only the specific project/folder you're working on
- Much faster than full library analysis
- More focused and relevant insights
- Perfect for single-project analysis

**Full Library Analysis:**

Use **"📊 Analyze All Files in Library"** when:
- You want insights across multiple projects
- You have imported several codebases
- You want to compare patterns across different projects

**Manual Single-File Approach:**

1. Start with the main entry point
2. Then analyze key controllers/services
3. Review model/data layer files
4. Check utility and helper files
5. Note connection patterns across files

**Recommendation**: Use folder analysis for focused project insights, then dive into specific files for details.

### Code Length

- **Optimal**: 100-500 lines of code
- **Acceptable**: Up to 1000 lines
- **Limited**: Over 1000 lines (truncated to first 8000 characters)

Larger files are automatically truncated to fit API limits.

### Language Support

Works best with:
- ✅ Strongly typed languages (TypeScript, Java, C#)
- ✅ Well-structured code with clear patterns
- ✅ Code with good naming conventions
- ⚠️ Minified or obfuscated code (limited results)
- ⚠️ Very domain-specific code (may miss nuances)

## Understanding the Results

### Architecture Section
Shows the overall design pattern and main components. Use this to understand the high-level structure.

### Purpose Section
A concise summary of what the file does. Great for quick orientation.

### Key Functions Section
Focus on HIGH importance functions first - these are critical to understanding the code.

### Dependencies Section
Useful for understanding external requirements and what this code provides to others.

### Connections Section
Helps you navigate to related files. When files "relate to" each other, they're working together.

### Code Quality Section
Use suggestions to guide refactoring and improvements.

## Privacy & Security

### Data Handling
- Code is sent to the AI provider for analysis
- Results are cached locally only
- No code is permanently stored on external servers
- API keys are stored locally in your browser

### Best Practices
- Don't analyze files containing API keys or secrets
- Review code before analysis if it contains sensitive logic
- Use Local Ollama for maximum privacy (100% local processing)
- Be cautious with proprietary algorithms

## Batch Analysis Options

### Three Analysis Modes

| Mode | Button | Scope | Best For |
|------|--------|-------|----------|
| **Single File** | 🚀 Analyze Current File | One file | Deep analysis |
| **Folder** ⭐ | 📁 Analyze Current Folder | Current project folder + subfolders | Most common use |
| **Full Library** | 📊 Analyze All Files in Library | All code files in library | Multi-project insights |

### Folder Analysis Details

**What Gets Analyzed:**
- All code files in the folder of the currently open file
- All subdirectories are included
- All 60+ supported languages
- Excludes: PDFs, EPUBs, DOCX, plain text, and markdown files

**How It Works:**
1. Open any file in your project
2. Click "Analyze Current Folder"
3. The app detects which folder that file belongs to
4. Analyzes all code files in that folder and its subfolders

### Analysis Speed
- **Per file**: ~15-30 seconds
- **10 files**: ~3-5 minutes
- **50 files**: ~15-25 minutes
- **100 files**: ~30-50 minutes

**Tips for faster analysis:**
- Use Ollama (local) for no rate limits
- Analyze during breaks or overnight
- Start with important directories first

### Project Summary Shows
- **Architecture Patterns**: Which patterns are used and where
- **Critical Functions**: High-importance functions across all files
- **Quality Distribution**: How many files have low/medium/high complexity
- **Design Patterns**: All patterns detected with their locations
- **Individual Results**: Status of each file analyzed

### Caching
- Each file's analysis is cached automatically
- Re-opening a file shows cached results instantly
- Re-running batch analysis skips previously analyzed files (coming soon)

## Troubleshooting

### "No code files found in library"
**Solution**: Import a project folder first using File → Open Folder...

### "No API key configured"
**Solution**: Set up your AI provider (see Getting Started section)

### "Analysis failed"
**Possible causes:**
- File is too large (try analyzing smaller portions)
- Code is in an unsupported or rare language
- Network issues (for cloud providers)
- API rate limit reached

**Solutions:**
- Try with Ollama for local processing
- Split large files into logical sections
- Wait a few minutes if rate limited
- Check your internet connection

### "No patterns detected"
**Possible causes:**
- Code is very simple
- File is mostly configuration
- Language-specific patterns not recognized

**This is normal for**: Config files, simple utilities, data files

### Poor Results
**Improve by:**
- Ensuring code has clear function/class names
- Analyzing well-structured code
- Trying a different AI provider
- Analyzing longer, more complex files

## Keyboard Shortcuts

Currently no dedicated shortcuts. Use:
- Mouse/touch to run analysis
- Tab key to navigate results
- Scroll to view full insights

## Features Comparison

| Feature | Single File | Folder Analysis | Full Library |
|---------|-------------|-----------------|--------------|
| **Speed** | Fast (30s) | Medium (minutes) | Slow (many minutes) |
| **Scope** | One file | Current project | All projects |
| **Detail Level** | Very detailed | Summary + details | High-level summary |
| **Best For** | Deep dive | Project overview | Multi-project insights |
| **Architecture View** | Single file | Folder-wide patterns | Library-wide patterns |
| **Function Analysis** | All functions | Critical functions | Critical functions |
| **Use When** | Reviewing specific code | Understanding a project | Comparing projects |

## Future Enhancements

Completed ✅:
- ✅ **Project-wide analysis** (multi-file insights) - NOW AVAILABLE!
- ✅ **Batch processing** with progress tracking
- ✅ **Architecture pattern detection** across files

Planned features:
- 📊 Visual architecture diagrams
- 🗺️ Interactive dependency graphs with clickable nodes
- 🔄 Compare analysis across versions
- 📝 Export analysis reports (PDF/Markdown)
- 🌐 Cross-file relationship mapping visualization
- 🎯 Security vulnerability detection
- 💾 Code smell detection
- ⚡ Smart caching (skip already-analyzed files in batch mode)
- 📈 Trend analysis (track quality over time)

## API Costs

### Ollama (Local)
- **Cost**: $0 - Completely free!
- **Privacy**: 100% local, no data sent externally
- **Speed**: Depends on your hardware
- **Best for**: Unlimited use, privacy-sensitive code

### Google Gemini (Cloud)
- **Free Tier**: 1,500 requests/day
- **Cost per analysis**: ~$0.001-0.003 (very affordable)
- **Best for**: Fast results, occasional use

### OpenAI GPT-4 (Cloud)
- **Cost per analysis**: ~$0.01-0.03
- **Best for**: Highest quality insights
- **Note**: Requires billing setup

## Support

### Need Help?
- Check this guide first
- Review troubleshooting section
- Check AI provider status
- Submit an issue on GitHub

### Provide Feedback
Help improve code analysis:
- Report patterns not detected
- Share successful use cases
- Suggest new features
- Report bugs

## Credits

- **AI Models**: OpenAI GPT-4, Google Gemini, Ollama (Llama)
- **Integration**: Grammar Highlighter Team
- **Supported Languages**: 60+ programming languages

---

**Last Updated**: December 2024
**Version**: 1.0.0

**Happy Code Exploring!** 💻✨
