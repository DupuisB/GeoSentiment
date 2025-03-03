import pandas as pd
import glob
import re
from textblob import TextBlob
import json
import os
import tqdm
import unicodedata
import csv
from multiprocessing import Pool, cpu_count
from functools import lru_cache

# Add function to normalize text (remove accents) with caching
@lru_cache(maxsize=10000)
def normalize_text(text):
    if not isinstance(text, str):
        return ""
    return ''.join(c for c in unicodedata.normalize('NFD', text)
                  if not unicodedata.combining(c)).lower()

# Define French departments (both numbers and names)
departments = {
    "01": "Ain", "02": "Aisne", "03": "Allier", "04": "Alpes-de-Haute-Provence", 
    "05": "Hautes-Alpes", "06": "Alpes-Maritimes", "07": "Ardèche", "08": "Ardennes", 
    "09": "Ariège", "10": "Aube", "11": "Aude", "12": "Aveyron", "13": "Bouches-du-Rhône", 
    "14": "Calvados", "15": "Cantal", "16": "Charente", "17": "Charente-Maritime", 
    "18": "Cher", "19": "Corrèze", "21": "Côte-d'Or", "22": "Côtes-d'Armor", 
    "23": "Creuse", "24": "Dordogne", "25": "Doubs", "26": "Drôme", "27": "Eure", 
    "28": "Eure-et-Loir", "29": "Finistère", "2A": "Corse-du-Sud", "2B": "Haute-Corse", 
    "30": "Gard", "31": "Haute-Garonne", "32": "Gers", "33": "Gironde", "34": "Hérault", 
    "35": "Ille-et-Vilaine", "36": "Indre", "37": "Indre-et-Loire", "38": "Isère", 
    "39": "Jura", "40": "Landes", "41": "Loir-et-Cher", "42": "Loire", 
    "43": "Haute-Loire", "44": "Loire-Atlantique", "45": "Loiret", "46": "Lot", 
    "47": "Lot-et-Garonne", "48": "Lozère", "49": "Maine-et-Loire", "50": "Manche", 
    "51": "Marne", "52": "Haute-Marne", "53": "Mayenne", "54": "Meurthe-et-Moselle", 
    "55": "Meuse", "56": "Morbihan", "57": "Moselle", "58": "Nièvre", "59": "Nord", 
    "60": "Oise", "61": "Orne", "62": "Pas-de-Calais", "63": "Puy-de-Dôme", 
    "64": "Pyrénées-Atlantiques", "65": "Hautes-Pyrénées", "66": "Pyrénées-Orientales", 
    "67": "Bas-Rhin", "68": "Haut-Rhin", "69": "Rhône", "70": "Haute-Saône", 
    "71": "Saône-et-Loire", "72": "Sarthe", "73": "Savoie", "74": "Haute-Savoie", 
    "75": "Paris", "76": "Seine-Maritime", "77": "Seine-et-Marne", "78": "Yvelines", 
    "79": "Deux-Sèvres", "80": "Somme", "81": "Tarn", "82": "Tarn-et-Garonne", 
    "83": "Var", "84": "Vaucluse", "85": "Vendée", "86": "Vienne", "87": "Haute-Vienne", 
    "88": "Vosges", "89": "Yonne", "90": "Territoire de Belfort", "91": "Essonne", 
    "92": "Hauts-de-Seine", "93": "Seine-Saint-Denis", "94": "Val-de-Marne", 
    "95": "Val-d'Oise", "971": "Guadeloupe", "972": "Martinique", "973": "Guyane", 
    "974": "La Réunion", "976": "Mayotte"
}


# Create reverse mapping and normalize once
departments_reverse = {v: k for k, v in departments.items()}
normalized_dept_names = {normalize_text(name): code for name, code in departments_reverse.items()}

# Precompile regexes for each department
dept_patterns = {
    code: re.compile(r'\b' + re.escape(normalize_text(name)) + r'\b')
    for name, code in departments_reverse.items()
}

@lru_cache(maxsize=1000)
def find_departments(text):
    """Find department name references in text, ignoring accents and case"""
    if not isinstance(text, str) or not text:
        return []
        
    found_departments = set()
    normalized_text = normalize_text(text)
    
    # Use precompiled regexes
    for code, pattern in dept_patterns.items():
        if pattern.search(normalized_text):
            found_departments.add(code)
    
    return list(found_departments)

@lru_cache(maxsize=1000)
def analyze_sentiment(text):
    """Perform sentiment analysis on text with caching"""
    if not isinstance(text, str) or not text:
        return 0
    try:
        blob = TextBlob(text)
        return blob.sentiment.polarity
    except:
        return 0

def process_file(file):
    """Process a single file and return results"""
    local_dept_comments = []
    local_results = {}
    
    for dept_num in departments:
        local_results[dept_num] = {
            "mentions": 0,
            "sentiment_scores": [],
            "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0}
        }
    
    try:
        # Only read the column we need (4)
        try:
            df = pd.read_csv(file, header=None, usecols=[4], encoding='utf-8')
        except UnicodeDecodeError:
            df = pd.read_csv(file, header=None, usecols=[4], encoding='latin1')
        
        # Process each comment
        for comment in df[4]:
            if not isinstance(comment, str):
                continue
            
            found_depts = find_departments(comment)
            
            if found_depts:
                sentiment_score = analyze_sentiment(comment)
                
                # Store comment with department mentions and sentiment
                dept_names = [departments[dept] for dept in found_depts]
                local_dept_comments.append({
                    'comment': comment,
                    'departments': ', '.join(dept_names),
                    'department_codes': ', '.join(found_depts),
                    'sentiment': sentiment_score
                })
                
                for dept in found_depts:
                    local_results[dept]["mentions"] += 1
                    local_results[dept]["sentiment_scores"].append(sentiment_score)
                    
                    # Categorize sentiment
                    if sentiment_score > 0.1:
                        local_results[dept]["sentiment_distribution"]["positive"] += 1
                    elif sentiment_score < -0.1:
                        local_results[dept]["sentiment_distribution"]["negative"] += 1
                    else:
                        local_results[dept]["sentiment_distribution"]["neutral"] += 1
    
    except Exception as e:
        print(f"Error processing {file}: {e}")
    
    return local_results, local_dept_comments

def main():
    # Process all CSV files
    csv_files = glob.glob('france_comments_part*.csv')
    total_files = len(csv_files)
    print(f"Processing {total_files} files using {min(cpu_count(), total_files)} processes")
    
    # Use multiprocessing to process files in parallel
    with Pool(processes=min(cpu_count(), total_files)) as pool:
        results_list = pool.map(process_file, csv_files)
    
    # Combine results
    results = {}
    dept_comments = []
    
    for dept_num, dept_name in departments.items():
        results[dept_num] = {
            "name": dept_name,
            "mentions": 0,
            "sentiment_scores": [],
            "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0}
        }
    
    for local_results, local_comments in results_list:
        dept_comments.extend(local_comments)
        
        for dept, data in local_results.items():
            results[dept]["mentions"] += data["mentions"]
            results[dept]["sentiment_scores"].extend(data["sentiment_scores"])
            results[dept]["sentiment_distribution"]["positive"] += data["sentiment_distribution"]["positive"]
            results[dept]["sentiment_distribution"]["neutral"] += data["sentiment_distribution"]["neutral"]
            results[dept]["sentiment_distribution"]["negative"] += data["sentiment_distribution"]["negative"]
    
    # Calculate average sentiment and clean up
    for dept, data in results.items():
        if data["mentions"] > 0:
            data["avg_sentiment"] = sum(data["sentiment_scores"]) / data["mentions"]
        else:
            data["avg_sentiment"] = 0
        del data["sentiment_scores"]  # Remove raw scores to save space
    
    # Save results
    with open('department_sentiment_analysis.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=4)
    
    # Save comments with department mentions more efficiently
    with open('department_comments.csv', 'w', encoding='utf-8', newline='') as f:
        if dept_comments:
            writer = csv.DictWriter(f, fieldnames=dept_comments[0].keys())
            writer.writeheader()
            writer.writerows(dept_comments)
    
    print("Analysis complete. Results saved to department_sentiment_analysis.json")
    print(f"Comments with department mentions saved to department_comments.csv ({len(dept_comments)} comments)")

if __name__ == "__main__":
    main()
