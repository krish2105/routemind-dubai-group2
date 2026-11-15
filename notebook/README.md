# notebook/ (ETA model and data export)

Claude Code (with Atharva) creates `routemind_models.ipynb` here in Phase 3.

- Put the Kaggle ETA dataset file in `notebook/data/raw/` (git-ignored, not zipped).
- The notebook exports JSON to `web/public/data/`: `eta_model.json`, `points.json`, `matrix.json` (optional: `forecast.json`, `rl.json`).
- Run in Google Colab or locally: `pip install pandas numpy scikit-learn xgboost lightgbm requests jupyter`.
- Remember: the ETA data is from India. It shows the method, not Dubai ground truth. Say so on slide 3.
