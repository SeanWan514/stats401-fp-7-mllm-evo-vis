PYTHON ?= python3
PORT ?= 8765

.PHONY: help serve restore require-cache rebuild validate test syntax check reproducibility site

help:
	@printf '%s\n' 'serve            Build and preview index.html (PORT=8765)' 'check            Run Python, syntax and Node regression checks' 'test             Run Python regression checks' 'restore          Restore public archives in a fresh clone' 'rebuild          Rebuild final tables and browser payload from complete caches' 'validate         Check full tables and browser counts' 'syntax           Check current and archived JavaScript' 'reproducibility  Compare repeated data builds after an initial rebuild' 'site             Build the allowlisted dist/ website'

serve: site
	@printf 'Open http://127.0.0.1:%s/\n' '$(PORT)'
	$(PYTHON) -m http.server $(PORT) --bind 127.0.0.1 --directory dist

restore:
	$(PYTHON) scripts/restore_public_data.py

require-cache:
	@$(PYTHON) -c "from pathlib import Path; import sys; paths=['data/raw/repositories','data/raw/model_cards','data/raw/feedback/normalized']; missing=[p for p in paths if not any(f.is_file() for f in Path(p).glob('*'))]; sys.exit('Missing raw caches: '+', '.join(missing)+'. Run make restore in a fresh clone first.' if missing else 0)"

rebuild: require-cache
	$(PYTHON) scripts/collect_repositories.py --process
	$(PYTHON) scripts/build_final_models.py
	$(PYTHON) scripts/process_feedback.py
	$(PYTHON) scripts/build_final_views.py
	$(PYTHON) scripts/validate_final_data.py
	$(PYTHON) scripts/build_explorer_data.py

validate:
	$(PYTHON) scripts/validate_final_data.py

test:
	$(PYTHON) -m unittest discover -s tests -v
	$(PYTHON) scripts/test_feedback_processing.py
	node --test tests/task-evidence.test.js

syntax:
<<<<<<< HEAD
	node --check final.js
	node --check task-evidence.js
=======
	node --check archive/website/final.js
	node --check assets/js/explorer.js
	node --check assets/js/explorer-core.mjs
	node --check assets/js/slides.js

check: test syntax
	node --test tests/*.test.mjs
>>>>>>> main

reproducibility: require-cache
	$(PYTHON) scripts/verify_offline_rebuild.py

site:
	$(PYTHON) scripts/build_static_site.py
