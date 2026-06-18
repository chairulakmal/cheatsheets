# Rails Cheatsheet

Ruby on Rails is a web framework that follows **convention over configuration** — it makes decisions for you so you can focus on building features instead of boilerplate.

---

## Creating a New App

```bash
gem install rails
rails new myapp --database=sqlite3
cd myapp
rails server
```

Visit `http://localhost:3000` to see your app running.

---

## MVC Structure

Rails organises code into three layers:

| Layer | Folder | Responsibility |
|-------|--------|---------------|
| Model | `app/models/` | Data and business logic |
| View | `app/views/` | HTML templates |
| Controller | `app/controllers/` | Handles requests and responses |

---

## Routes

Define URL patterns in `config/routes.rb`.

```ruby
Rails.application.routes.draw do
  root "pages#home"
  get  "/about", to: "pages#about"
  post "/contact", to: "contact#create"
end
```

`resources` generates all seven standard RESTful routes at once:

```ruby
resources :articles
# GET    /articles          → articles#index
# GET    /articles/:id      → articles#show
# GET    /articles/new      → articles#new
# POST   /articles          → articles#create
# GET    /articles/:id/edit → articles#edit
# PATCH  /articles/:id      → articles#update
# DELETE /articles/:id      → articles#destroy
```

Check all routes with `rails routes` in the terminal.

---

## Controllers

Generate a controller with its actions:

```bash
rails generate controller Articles index show new
```

A controller action reads data and picks a view to render:

```ruby
class ArticlesController < ApplicationController
  def index
    @articles = Article.all
  end

  def show
    @article = Article.find(params[:id])
  end
end
```

Instance variables (starting with `@`) are automatically available in the view.

Use **strong parameters** to whitelist what users can submit:

```ruby
def article_params
  params.require(:article).permit(:title, :body)
end
```

---

## Views (ERB)

Views are HTML files with embedded Ruby, stored in `app/views/<controller>/`.

```erb
<!-- app/views/articles/index.html.erb -->
<h1>All Articles</h1>

<% @articles.each do |article| %>
  <p><%= article.title %></p>
<% end %>
```

`<% %>` runs Ruby without printing anything. `<%= %>` runs Ruby and prints the result.

Common view helpers:

```erb
<%= link_to "Home", root_path %>
<%= link_to "Edit", edit_article_path(@article) %>
<%= link_to "Delete", @article, data: { turbo_method: :delete } %>
<%= image_tag "logo.png", alt: "Logo" %>
```

---

## Models

Generate a model with its database columns:

```bash
rails generate model Article title:string body:text published:boolean
```

A model class inherits from `ApplicationRecord` and maps to a database table:

```ruby
class Article < ApplicationRecord
  # columns: id, title, body, published, created_at, updated_at
end
```

---

## Migrations

Migrations describe changes to the database schema. Run them with:

```bash
rails db:migrate
```

A generated migration looks like this:

```ruby
class CreateArticles < ActiveRecord::Migration[7.1]
  def change
    create_table :articles do |t|
      t.string  :title
      t.text    :body
      t.boolean :published, default: false

      t.timestamps  # adds created_at and updated_at
    end
  end
end
```

---

## ActiveRecord — Creating and Saving

```ruby
# Create and save in one step
article = Article.create(title: "Hello", body: "My first post")

# Build then save separately
article = Article.new(title: "Hello", body: "My first post")
article.save   # => true

# Update a record
article.update(title: "Updated title")

# Delete a record
article.destroy
```

---

## ActiveRecord — Querying

```ruby
Article.all                          # => all articles
Article.find(1)                      # => article with id 1
Article.find_by(title: "Hello")      # => first match or nil

Article.where(published: true)       # => all published articles
Article.where("created_at > ?", 1.week.ago)

Article.order(created_at: :desc)     # => newest first
Article.limit(10)                    # => first 10 records
Article.count                        # => 42
```

Chain methods together:

```ruby
Article.where(published: true).order(created_at: :desc).limit(5)
```

---

## Associations

Declare relationships between models:

```ruby
class Author < ApplicationRecord
  has_many :articles, dependent: :destroy
end

class Article < ApplicationRecord
  belongs_to :author
  has_many   :comments
  has_one    :thumbnail
end
```

Use associations like methods:

```ruby
author = Author.find(1)
author.articles           # => all articles by this author
author.articles.create(title: "New post")

article = Article.find(1)
article.author            # => the author object
article.author.name       # => "Alice"
```

---

## Validations

Add validations to your model to prevent bad data from being saved:

```ruby
class Article < ApplicationRecord
  validates :title, presence: true, length: { minimum: 3 }
  validates :body,  presence: true
  validates :status, inclusion: { in: %w[draft published] }
end
```

Check if a record is valid:

```ruby
article = Article.new(title: "")
article.valid?          # => false
article.errors.full_messages
# => ["Title can't be blank", "Body can't be blank"]
```

---

## Rails Console

The Rails console lets you interact with your app from the terminal:

```bash
rails console   # or: rails c
```

```ruby
# Try things out interactively
Article.count                     # => 3
Article.last.title                # => "Hello World"
Article.create(title: "Test", body: "Body text")
```

---

## Useful Commands

```bash
rails generate model    Post title:string   # create a model
rails generate controller Pages home        # create a controller
rails db:migrate                            # run pending migrations
rails db:rollback                           # undo the last migration
rails db:seed                               # run db/seeds.rb
rails routes                               # list all routes
rails test                                 # run the test suite
```
