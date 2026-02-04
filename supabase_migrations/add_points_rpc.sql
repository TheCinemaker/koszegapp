-- ADD POINTS RPC (Security Definer)
-- Ez a funkció "root" jogokkal fut, így megkerüli az RLS problémákat a pontjóváírásnál.

CREATE OR REPLACE FUNCTION public.add_koszegpass_points(
    p_user_id uuid, 
    p_amount int,  -- Ez az összeg (pl. 3900), nem a pont!
    p_source text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- FONTOS: Ez adja a jogokat!
SET search_path = public
AS $$
DECLARE
  v_current_points int;
  v_added_points int;
  v_new_points int;
  v_new_card_type text;
  v_user_status text;
BEGIN
  -- 1. Ellenőrzés és Jelenlegi adatok lekérése
  SELECT points, status INTO v_current_points, v_user_status 
  FROM koszegpass_users WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Felhasználó nem található');
  END IF;

  IF v_user_status NOT IN ('active', 'approved') THEN
     RETURN json_build_object('success', false, 'message', 'Felhasználó inaktív');
  END IF;

  -- 2. Pontszámítás (1000 Ft = 1 pont)
  v_added_points := FLOOR(p_amount / 1000);

  IF v_added_points < 1 THEN
     RETURN json_build_object('success', false, 'reason', 'below_threshold', 'message', 'A vásárlás összege nem éri el az 1000 Ft-ot.');
  END IF;

  v_new_points := COALESCE(v_current_points, 0) + v_added_points;

  -- 3. Kártyatípus kalkuláció
  IF v_new_points >= 20000 THEN v_new_card_type := 'diamant';
  ELSIF v_new_points >= 10000 THEN v_new_card_type := 'gold';
  ELSIF v_new_points >= 5000 THEN v_new_card_type := 'silver';
  ELSE v_new_card_type := 'bronze';
  END IF;

  -- 4. UPDATE (Ez a Security Definer miatt mindenképp lefut!)
  UPDATE koszegpass_users 
  SET points = v_new_points, card_type = v_new_card_type
  WHERE id = p_user_id;

  -- 5. LOGOLÁS
  INSERT INTO koszegpass_points_log (user_id, amount, points, source)
  VALUES (p_user_id, p_amount, v_added_points, p_source);

  RETURN json_build_object(
    'success', true, 
    'newPoints', v_new_points, 
    'addedPoints', v_added_points,
    'cardType', v_new_card_type
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Adatbázis hiba: ' || SQLERRM);
END;
$$;

-- Jogosultság, hogy az Anon/Authenticated user (vagy a backend) meghívhassa
GRANT EXECUTE ON FUNCTION public.add_koszegpass_points TO anon, authenticated, service_role;

SELECT '✅ RPC function created: add_koszegpass_points' as status;
