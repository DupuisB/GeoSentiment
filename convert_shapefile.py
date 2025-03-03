import geopandas as gpd
import os

# Create data directory if it doesn't exist
data_dir = os.path.join(os.path.dirname(__file__), 'data')
if not os.path.exists(data_dir):
    os.makedirs(data_dir)

# Path to your input shapefile
shapefile_path = 'contours_departements.shp'

# Path for output GeoJSON
geojson_path = os.path.join(data_dir, 'departments.geojson')

# Read the shapefile
gdf = gpd.read_file(shapefile_path)

# Make sure the data is in WGS84 (standard for web mapping)
gdf = gdf.to_crs(epsg=4326)

# Write to GeoJSON
gdf.to_file(geojson_path, driver="GeoJSON")

print(f"Conversion complete: {shapefile_path} -> {geojson_path}")
